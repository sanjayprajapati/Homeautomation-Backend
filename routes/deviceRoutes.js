const express = require("express");
const {
  getAllDeviceByDeviceId,
  updateAllDeviceByDeviceId,
  getSingleDeviceById,
  updateSingleDeviceById,
  testing,
  getDeviceTye,
  getContollerId,
  getControllerWithRoomName,
  getAllDeviceByQueryParms,
  updateAllDeviceByRoomId,
  getAllController,
  getAllDeviceIds,
  getAllData,
  addAlarm,
  getAlarm,
  editAlarm,
  deleteAlarm,
} = require("../controllers/deviceController");

const router = express.Router();
router.route("/devices/:id").get(getAllDeviceByDeviceId);
router.route("/device/update-all-device").put(updateAllDeviceByDeviceId);
router.route("/device/get-single-device/:id").get(getSingleDeviceById);
router.route("/device/update-single-device").put(updateSingleDeviceById);
router.route("/device/controller-type").get(getDeviceTye);
router.route("/device/controller").post(getContollerId);
router
  .route("/device/controllers-with-room-name/:userId")
  .get(getControllerWithRoomName);

router
  .route("/device/update-all-device-by-room/:roomId/:pawerState")
  .put(updateAllDeviceByRoomId);

//router.route("/device/devices-by-room/:userId").get(getAllDeviceByRoom);
// serch all devices by userid and userid+controllerid
// serch all devices by userid and userid+roomid
router.route("/device/get-all-data/:userId").get(getAllData);
router.route("/device/devices-by-query-params").get(getAllDeviceByQueryParms);
router.route("/device/all-controllers/:userId").get(getAllController);
router.route("/device/all-deviceids/:userId").get(getAllDeviceIds);

router.route("/device/add-alarm").post(addAlarm);
router.route("/device/get-alarm").post(getAlarm);
router.route("/device/edit-alarm").put(editAlarm);
router.route("/device/delete-alarm").post(deleteAlarm);
router.route("/device/testing").get(testing);

// router.route("/resendOtp").get(resendOtp);
// router.route("/register/veifyotp").post(verifyOtp);
// router.route("/resetpassword").put(resetPassword);

module.exports = router;
