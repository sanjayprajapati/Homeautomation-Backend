const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ControllerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  controllerId: {
    type: String,
    required: true,
    unique: true,
  },
  controllerTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ControllerType",
    required: true,
  },
  assigned: {
    type: Boolean,
    default: false,
  },
  assignedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoomType",
  },
  appkey: {
    type: String,
    required: true,
  },
  appsecret: {
    type: String,
    required: true,
  },
  activatedAt: {
    type: Date,
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
  ip: String,
  mac: String,
  platform: String,
  sdkversion: String,
});

module.exports = mongoose.model("Controller", ControllerSchema);
