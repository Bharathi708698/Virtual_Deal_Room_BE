const redisClient = require("../config/redis");
const DealModel = require("../models/DealModel");
const UserModel = require("../models/UserModel");
const shortid = require("shortid");

// Create Deal (Buyer only)
let DealCreationController = async (req, res) => {
  try {
    let {
      title,
      description,
      price,
      participants,
      cmd,
      id,
      finalprice,
      status,
      enable,
    } = req.body;
    let user = req.user;

    const file = req.file ? req.file.path : null;

    if (cmd === "create") {
      if (!(user.role === "buyer")) {
        return res.status(400).json({ msg: "Buyer only create the Deal" });
      }

      price = Math.abs(price);
      price = Number(price.toFixed(2));

      if (
        !title ||
        !description ||
        !price ||
        !(price > 10) ||
        !participants 
      ) {
        return res.status(400).json({ msg: "Bad Request" });
      }

      const uniqueId = shortid.generate();
      const deal = new DealModel({
        title,
        description,
        price,
        finalPrice: price,
        hash: user.hash,
        participants,
        id: uniqueId,
        file: file,
      });

      await deal.save();
      return res.status(201).json({ msg: "Success", value: deal });
    } else if (cmd === "updateprice") {
      if (!(user.role === "buyer")) {
        return res.status(400).json({ msg: "Buyer only access this Data" });
      }
      if (!finalprice || !id) {
        return res.status(400).json({ msg: "Bad Request" });
      }

      finalprice = Math.abs(finalprice);
      finalprice = Number(finalprice.toFixed(2));

      let updateData = await DealModel.findOneAndUpdate(
        { id: id },
        { finalPrice: finalprice },
        { new: true }
      );

      return res
        .status(200)
        .json({ msg: "Price updated Successfully", value: updateData.status });
    } else if (cmd === "updatestatus") {
      if (!(user.role === "seller")) {
        return res.status(400).json({ msg: "Seller only access this Data" });
      }
      if (!status || !id ) {
        return res.status(400).json({ msg: "Bad Request" });
      }

      console.log(status, id, "line 84");

      let updateData = await DealModel.findOneAndUpdate(
        { id: id },
        { status: status },
        { new: true }
      );

      return res
        .status(200)
        .json({ msg: "Status updated Successfully", value: updateData.status });
    } else if (cmd === "updatefile") {
      if (!(user.role === "buyer")) {
        return res.status(400).json({ msg: "Buyer only access this Data" });
      }

      // console.log(id, enable);
      if (!id) {
        return res.status(400).json({ msg: "Bad Request" });
      }

      let updateData = await DealModel.findOneAndUpdate(
        { id: id },
        { fileVisible: Boolean(enable) },
        { new: true }
      );

      return res
        .status(200)
        .json({ msg: "Price updated Successfully", value: updateData.status });
    } else {
      return res.status(400).json({ msg: "Bad Request" });
    }
  } catch (err) {
    // console.log(`${err.message} >>>>>>>>>> Error in DealCreation`);
    return res
      .status(500)
      .json({ msg: "Something went wrong. Try after sometimes" });
  }
};

let GetDealsController = async (req, res) => {
  try {
    const user = req.user;

    let deals;

    if (redisClient.isReady) {
      deals = await redisClient.get("getDeals");
    }
    if (deals) {
      // console.log("<<<<<<<<<<<<<<<<  Redis DAta   >>>>>>>>>>>>>>>>>>>>");
      return res.status(200).json({ msg: "Success", value: JSON.parse(deals) });
    } else {
      deals = await DealModel.aggregate([
        {
          $match: { hash: user.hash },
        },
        {
          $lookup: {
            from: "users", // Referring to the "users" collection
            localField: "participants", // Field in 'deals' to match against
            foreignField: "email", // Field in 'users' collection
            as: "userDetails", // The result will be placed in the 'userDetails' array
          },
        },
        {
          $project: {
            _id: 0,
            title: 1,
            description: 1,
            id: 1,
            price: 1,
            status: 1,
            finalPrice: 1,
            fileVisible: 1,
            file: 1,
            paymentStatus: 1,
            participants: {
              $let: {
                vars: {
                  emails: {
                    $split: ["$participants", ", "], // Split the participants into an array if it's a string
                  },
                },
                in: {
                  $map: {
                    input: "$$emails",
                    as: "email",
                    in: {
                      $let: {
                        vars: {
                          user: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$userDetails",
                                  as: "user",
                                  cond: { $eq: ["$$user.email", "$$email"] },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          email: "$$email",
                          name: { $ifNull: ["$$user.name", "Unknown"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);
      if (!deals || deals.length === 0) {
        // console.log("enteredf in condigtion");
        return res
          .status(200)
          .json({ msg: "Create your first deal", value: deals });
      }
      // console.log("Before saving Redis");
      if (redisClient.isReady) {
        redisClient.setEx("getDeals", 5, JSON.stringify(deals));
      }
    }

    return res.status(200).json({ msg: "Success", value: deals });
  } catch (err) {
    // console.log(`${err.message} >>>>>>>>>> Error in GetDealController`);
    return res
      .status(500)
      .json({ msg: "Something went wrong. Try after sometimes" });
  }
};

let GetSellerController = async (req, res) => {
  try {
    let user = req.user;
    if (user && !(user.role === "buyer")) {
      return res
        .status(400)
        .json({ msg: "Seller can't get the all seller list" });
    }
    const sellerDetails = await UserModel.find({ role: "seller" }).select(
      "name email -_id"
    );
    if (!sellerDetails) {
      return res.status(400).json({ msg: "Bad Request" });
    }

    return res.status(200).json({ value: sellerDetails });
  } catch (err) {
    // console.log(`${err.message} >>>>>>>>>> Error in GetDealController`);
    return res
      .status(500)
      .json({ msg: "Something went wrong. Try after sometimes" });
  }
};

let getAssignedDeals = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res
        .status(403)
        .json({ msg: "Only sellers can access this route" });
    }

    let sellerDeals;

    if (redisClient.isReady) {
      sellerDeals = await redisClient.get("sellerDeals");
    }
    if (sellerDeals) {
      // console.log("<<<<<<<<<<<<<<<<  Redis DAta   >>>>>>>>>>>>>>>>>>>>");
      return res
        .status(200)
        .json({ msg: "Success", value: JSON.parse(sellerDeals) });
    } else {
      sellerDeals = await DealModel.aggregate([
        {
          $match: {
            participants: user.email,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            finalPrice: 1,
            status: 1,
            id: 1,
            paymentStatus: 1,
            file: {
              $cond: {
                if: { $eq: ["$fileVisible", true] },
                then: "$file",
                else: null,
              },
            },
          },
        },
      ]);
      // console.log("Before saving Redis");
      if (redisClient.isReady) {
        redisClient.setEx("sellerDeals", 5, JSON.stringify(sellerDeals));
      }
    }

    return res.status(200).json({ msg: "Success", value: sellerDeals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  DealCreationController,
  GetDealsController,
  GetSellerController,
  getAssignedDeals,
};
