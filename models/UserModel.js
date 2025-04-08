const mongoose = require("mongoose");
const { UserDB } = require("../config/database.js");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    hash: {type: String, required: true},
    role: { type: String, enum: ["buyer", "seller"], required: true },
    jwtSecret: {type: String}
  },
  { timestamps: true }
);

const UserModel = UserDB?.model("User", UserSchema);

module.exports = UserModel;