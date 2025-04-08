const mongoose = require("mongoose");
const { UserDB } = require("../config/database.js");

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    finalPrice: { type: Number },
    status: {
      type: String,
      enum: ["Pending", "Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    id: { type: String },
    hash: { type: String, required: true },
    participants: { type: String },
    file: {
      type: String,
    },
    fileVisible: {
      type: Boolean,
    },
    paymentStatus: {
      type: String,
      enum: ["Processing", "Success", "Failed"],
      default: "Processing",
    },
  },
  { timestamps: true }
);

const DealModel = UserDB.model("Deal", dealSchema);

module.exports = DealModel;
