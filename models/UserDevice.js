const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const AddDeviceSchema = new mongoose.Schema({
  mapdevice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminDevice",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// Generating Device ID
AddDeviceSchema.methods.getDeviceId = function () {
  // Generating ID
};

module.exports = mongoose.model("AddDevice", AddDeviceSchema);
