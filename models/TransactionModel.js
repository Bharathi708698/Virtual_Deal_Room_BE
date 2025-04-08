const mongoose = require("mongoose");
const { UserDB } = require("../config/database.js");

const transactionSchema = new mongoose.Schema(
  {
    dealId: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    Status: {
      type: String,
      enum: ["Processing", "Success", "Failed"],
      default: "Processing",
    },
    paymentDetails: {
      type: Object,
    },
  },
  { timestamps: true }
);

let TransactionModel = UserDB.model("transaction", transactionSchema);

module.exports = TransactionModel;
