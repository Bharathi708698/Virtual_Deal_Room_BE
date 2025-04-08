const mongoose = require("mongoose");
const { UserDB } = require("../config/database.js");

const chatSchema = new mongoose.Schema(
  {
    dealId: {
      type:String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
    },
    readBy: {type: String},
  },
  { timestamps: true }
);

let ChatModel =  UserDB.model("Chat", chatSchema);

module.exports = ChatModel;