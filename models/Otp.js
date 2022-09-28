const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const OtpSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  otpExpore: {
    type: Date,
    default: Date.now() + 5 * 60 * 1000,
  },
});
OtpSchema.pre("save", async function (next) {
  if (!this.isModified("token")) {
    next();
  }

  this.token = await bcrypt.hash(this.token, 12);
});

// Compare TOken

OtpSchema.methods.compareToken = async function (enteredToken) {
  return await bcrypt.compare(enteredToken, this.token);
};

module.exports = mongoose.model("Otp", OtpSchema);
