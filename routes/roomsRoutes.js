const express = require("express");

const router = express.Router();

const { getRoomType } = require("../controllers/roomsController.js");
const {
  isAuthenticatedUser,
  checkVerification,
} = require("../middlewares/auth");

router.route("/rooms/room-type").get(getRoomType);

// router.route("/resendOtp").get(resendOtp);
// router.route("/register/veifyotp").post(verifyOtp);
// router.route("/resetpassword").put(resetPassword);

module.exports = router;
