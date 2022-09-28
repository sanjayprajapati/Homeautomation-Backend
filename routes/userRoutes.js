const express = require("express");

const router = express.Router();

const {
  userRegister,
  userLogin,
  verifyOtp,
  forgotPassword,
  resetPassword,
  logout,
  getUserDetails,
  createRoom,
  createHome,
  updateHome,
  configureDevice,
  getRooms,
  updateRoomName,
  finaltepWithRoomAvailable,
  finaltepWithoutRoomAvailable,
} = require("../controllers/userController");
const {
  isAuthenticatedUser,
  checkVerification,
} = require("../middlewares/auth");

router.route("/user/signup").post(userRegister);
router.route("/user/verifyotp").post(verifyOtp);
router.route("/user/signin").post(userLogin);
router.route("/user/logout").get(logout);
router.route("/user/forget-password").post(forgotPassword);
router.route("/user/reset-password").put(resetPassword);
router.route("/user/me").get(isAuthenticatedUser, getUserDetails);
router.route("/user/rooms/create-room").post(createRoom);
router.route("/user/rooms/update-room-name").put(updateRoomName);

router.route("/user/rooms/:userId").get(getRooms);
router.route("/user/home/:userId").get(createHome);
router.route("/user/update-home").put(updateHome);
router.route("/user/configure-controller").put(configureDevice);
router.route("/user/finalstep-with-room").put(finaltepWithRoomAvailable);
router.route("/user/finalstep-without-room").post(finaltepWithoutRoomAvailable);

// router.route("/resendOtp").get(resendOtp);
// router.route("/register/veifyotp").post(verifyOtp);
// router.route("/resetpassword").put(resetPassword);

module.exports = router;
