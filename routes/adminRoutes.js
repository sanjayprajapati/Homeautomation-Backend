const express = require("express");

const {
  createController,
  createRoomType,
  createControllerType,
  adminLogin,
  adminDetail,
  getAllUsers,
  getAllControllers,
  getControllerType,
  downloadFile,
} = require("../controllers/adminController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const router = express.Router();
// Admin Routes

router.route("/admin/login").post(adminLogin);
router
  .route("/admin/me")
  .get(isAuthenticatedUser, authorizeRoles("ADMIN"), adminDetail);

router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("ADMIN"), getAllUsers);

router
  .route("/admin/create-controller-type")
  .post(isAuthenticatedUser, authorizeRoles("ADMIN"), createControllerType);
router
  .route("/admin/create-controller")
  .post(isAuthenticatedUser, authorizeRoles("ADMIN"), createController);
router
  .route("/admin/controllerstype")
  .get(isAuthenticatedUser, authorizeRoles("ADMIN"), getControllerType);
router
  .route("/admin/controllers")
  .get(isAuthenticatedUser, authorizeRoles("ADMIN"), getAllControllers);

router
  .route("/admin/create-room-type")
  .post(isAuthenticatedUser, authorizeRoles("ADMIN"), createRoomType);

router
  .route("/admin/downloads/:id")
  .get(isAuthenticatedUser, authorizeRoles("ADMIN"), downloadFile);

// router
//   .route("/admin/create-device")
//   .post(isAuthenticatedUser, authorizeRoles("ADMIN"), creatDevice);

module.exports = router;
