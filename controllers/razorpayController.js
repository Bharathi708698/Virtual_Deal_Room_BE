const crypto = require("crypto");
const Razorpay = require("razorpay");
const UserModel = require("../models/UserModel");
const DealModel = require("../models/DealModel");
const TransactionModel = require("../models/TransactionModel");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CreateOrderController = async (req, res) => {
  try {
    const { id } = req.body;

    console.log(id);

    const user = req.user;
    if (!id) {
      return res.status(400).json({ msg: "Bad Request" });
    }

    let dealDetails = await DealModel.findOne({
      id: id,
      hash: user.hash,
    });

    if (!dealDetails) {
      return res.status(400).json({ msg: "Bad Request" });
    }

    // Create an order

    const option = {
      amount: dealDetails.finalPrice * 100, // Razorpay requires the amount in paise
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
      payment_capture: 1, // Auto-capture the payment
    };

    const order = await razorpayInstance.orders.create(option);

    if (!order) {
      return res
        .status(500)
        .send("Some error occurred while creating the order");
    }

    const options = {
      key: process.env.RAZORPAY_KEY_ID,
      amount: dealDetails.finalPrice * 100,
      currency: "INR",
      name: user.name,
      description: `${id}`,
      order_id: order.id,
      prefill: {
        name: user.name,
        email: user.email,
        contact: "9999999999",
      },
    };

    let tras = await TransactionModel.findOne({ dealId: id });

    if (tras && tras.Status == "Processing") {
      // console.log(tras.Status, "in Delete Component");
      await TransactionModel.findOneAndDelete({ dealId: id });
    } else if (tras && tras.Status == "Success") {
      return res.status(400).json({ msg: "Bad Request" });
    } else if (tras && tras.Status == "Failed") {
      return res.status(400).json({ msg: "Bad Request" });
    }

    await TransactionModel.create({
      dealId: id,
      amount: dealDetails.finalPrice,
      paymentDetails: { orderId: order.id },
    });

    // console.log("<<<<<<<<<<<<<<<<<<<<<<<<<  >>>>>>>>>>>>>>>>>>>>")

    // console.log(options);

    return res.status(200).json({
      msg: "Success",
      value: options,
    });
  } catch (error) {
    // console.error("Error creating Razorpay order:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const VerifyPaymentController = async (req, res) => {
  const { paymentId, orderId, signature } = req.body;

  if (!paymentId || !orderId || !signature) {
    return res.status(400).json({ msg: "Bad Request" });
  }

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  shasum.update(orderId + "|" + paymentId);
  const generatedSignature = shasum.digest("hex");

  if (generatedSignature === signature) {
    const paymentDetails = await razorpayInstance.payments.fetch(paymentId);

    // Compare the signature with the response signature
    if (paymentDetails && paymentDetails.status === "captured") {
      let id = paymentDetails.description;
      let dealDetails = await DealModel.findOne({ id });

      if (!dealDetails) {
        return res.status(400).json({ msg: "Bad Requst Transaction failed" });
      }

      let transData = await TransactionModel.findOne({
        dealId: id,
        Status: "Processing",
      });

      if (!transData) {
        return res.status(400).json({ msg: "Invalid Request" });
      }

      transData.Status = "Success";
      transData.paymentDetails = {
        ...transData.paymentDetails,
        paymentDetails,
      };

      await transData.save();

      dealDetails.status = "Completed";
      dealDetails.paymentStatus = "Success";

      await dealDetails.save();
      return res.status(200).json({
        success: true,
        message: "Payment successfully verified!",
        paymentDetails,
      });
    } else {
      // If payment is not captured
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Payment not captured.",
      });
    }
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Payment verification failed" });
  }
};

const TransactionController = async (req, res) => {
  try {
    const user = req.user;
    let dealData;
    if (user.role === "buyer") {
      dealData = await DealModel.aggregate([
        {
          $match: {
            paymentStatus: "Success",
            hash: user.hash,
          },
        },
        {
          $lookup: {
            from: "users", // name of the User collection
            localField: "participants", // email stored in Deal
            foreignField: "email", // email in User
            as: "sellerInfo",
          },
        },
        {
          $unwind: "$sellerInfo",
        },
        {
          $project: {
            _id: 0,
            title: 1,
            description: 1,
            finalPrice: 1,
            paymentStatus: 1,
            id: 1,
            name: "$sellerInfo.name",
          },
        },
      ]);
    } else if (user.role === "seller") {
      dealData = await DealModel.aggregate([
        {
          $match: {
            paymentStatus: "Success",
            participants: user.email,
          },
        },
        {
          $lookup: {
            from: "users", // name of the User collection
            localField: "hash", // email stored in Deal
            foreignField: "hash", // email in User
            as: "buyerInfo",
          },
        },
        {
          $unwind: "$buyerInfo",
        },
        {
          $project: {
            _id: 0,
            title: 1,
            description: 1,
            finalPrice: 1,
            paymentStatus: 1,
            id: 1,
            name: "$buyerInfo.name",
          },
        },
      ]);
    }

    if (!dealData || dealData.length === 0) {
      return res.status(200).json({ value: [] });
    }

    return res.status(200).json({ value: dealData });
  } catch (err) {
    console.error("Transaction Fetch Error:", err);
    return res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = {
  CreateOrderController,
  VerifyPaymentController,
  TransactionController,
};
