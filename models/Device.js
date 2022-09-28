const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const DeviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  controllerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "ControllerId",
  },
  pawerState: {
    type: String,
    enum: ["On", "Off"],
    default: "Off",
  },
  iconType: {
    type: String,
  },
  homeScreen: {
    type: Boolean,
    default: false,
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
});

// Generating Device ID
DeviceSchema.methods.getDeviceId = function () {
  // Generating ID
};

module.exports = mongoose.model("Device", DeviceSchema);
