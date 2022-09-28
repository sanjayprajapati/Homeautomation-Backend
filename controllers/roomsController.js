const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const RoomType = require("../models/RoomType");
const ErrorHandler = require("../utils/errorHandler");

// get room type
exports.getRoomType = catchAsyncErrors(async (req, res, next) => {
  let roomtype = await RoomType.find();
  if (!roomtype) {
    return next(new ErrorHandler("Room Type not found", 401));
  }
  res
    .status(200)
    .json({ success: true, message: "Room Type Found", rooms: roomtype });
});
