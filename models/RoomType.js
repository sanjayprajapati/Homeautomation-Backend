const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const RoomTypeSchema = new mongoose.Schema({
  roomtype: {
    type: String,
    required: [true, "Please Enter Room Names"],
    unique: true,
  },
});

// Generating Device ID
RoomTypeSchema.methods.getDeviceId = function () {
  // Generating ID
};

module.exports = mongoose.model("RoomType", RoomTypeSchema);
