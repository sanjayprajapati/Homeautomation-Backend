const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AlarmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true,
  },
  action: {
    type: String,
    enum: ["On", "Off"],
    required: true,
  },
  days: {
    type: Array,
    required: true,
  },
  time: {
    type: Number,
    required: true,
  },
  enabled: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Alarm", AlarmSchema);
