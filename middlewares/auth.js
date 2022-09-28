const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  console.log(req);

  if (!token) {
    return next(new ErrorHandler("Please Login First", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.id);

  next();
});

exports.checkVerification = catchAsyncErrors(async (req, res, next) => {
  const { verifyUserToken } = req.cookies;

  if (!verifyUserToken) {
    return next(new ErrorHandler("Somethin went wrong", 401));
  }

  const decodedData = jwt.verify(
    verifyUserToken,
    process.env.JWT_VERIFICATION_SECRET
  );

  req.user = await User.findById(decodedData.id);

  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    next();
  };
};
