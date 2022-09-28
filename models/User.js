const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rejx = /^[6789][0-9]{9}$/;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxlength: [50, "Can not exceed 50 characters"],
    minlength: [4, "Name should have more than 4 characters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter your Email"],
    validate: [validator.isEmail, "Please enter a valid Email"],
  },
  mobile: {
    type: String,
    required: [true, "Please Enter your Mobile No."],
    match: [rejx, "Please enter a valid mobile no"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: [8, "Password Must be greater than 8 characters"],
    select: false,
  },
  avatar: {
    public_id: String,
    url: String,
  },
  role: {
    type: String,
    enum: ["ADMIN", "USER", "DEALER"],
    default: "USER",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  userStatus: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifyExpire: Date,
  resetPasswordOtp: Number,
  resetPasswordOtpExpire: Date,
});
UserSchema.index({ email: 1, mobile: 1 }, { unique: true });
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 12);
});
// JWT TOKEN
UserSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE * 24 * 60 * 60 * 1000,
  });
};

// User Verify token
UserSchema.methods.getUserVerificationToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_VERIFICATION_SECRET, {
    expiresIn: process.env.JWT_VERIFICATION_EXPIRE * 60 * 1000,
  });
};

// Compare Password

UserSchema.methods.comparePassword = async function (enteredPpassword) {
  return await bcrypt.compare(enteredPpassword, this.password);
};

// Generating Password Reset Token
UserSchema.methods.getResetPasswordOtp = function () {
  // Generating Token
  const resetOtp = Math.floor(Math.random() * 1000000);

  this.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

  return resetOtp;
};

// Deleting user if not verified
//UserSchema.index({ otpExpire: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("User", UserSchema);
