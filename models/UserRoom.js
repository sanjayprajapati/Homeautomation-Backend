const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserRoomSchema = new mongoose.Schema({
  roomname: {
    type: String,
    required: [true, "Please Enter Room Names"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  controllers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Controller",
    },
  ],
});
UserRoomSchema.index({ roomname: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("UserRoom", UserRoomSchema);
