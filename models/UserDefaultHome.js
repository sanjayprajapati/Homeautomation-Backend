const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserDefaultHomeSchema = mongoose.Schema({
  name: {
    type: String,
    default: "Sweet Home",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("UserDefaultHome", UserDefaultHomeSchema);
