const User = require("../models/User");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/sendToken");
const sendOtp = require("../utils/sendOtp");
const sendEmail = require("../utils/sendMail");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const otpGenerator = require("otp-generator");
const sendVerificationToken = require("../utils/sendVerificationToken");
const { isValidObjectId } = require("mongoose");
const UserAccommodation = require("../models/UserAccommodation");
const UserDefaultHome = require("../models/UserDefaultHome");
const UserRoom = require("../models/UserRoom");
const RoomType = require("../models/RoomType");
const Otp = require("../models/Otp");
const { v4: uuidv4 } = require("uuid");
const Device = require("../models/Device");
const Controller = require("../models/Controller");

// User Registration
exports.userRegister = catchAsyncErrors(async (req, res, next) => {
  const { name, email, mobile, password } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorHandler("User already exists", 400));
  }
  user = await User.findOne({ mobile });
  if (user) {
    return next(
      new ErrorHandler(
        "Mobile no. is already registered with other account",
        400
      )
    );
  }

  user = await User.create({
    name,
    email,
    mobile,
    password,
  });
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  console.log(otp);
  const verificationOtpToken = new Otp({
    owner: user._id,
    token: otp,
  });

  await verificationOtpToken.save();
  await user.save();
  //console.log(verificationOtpToken);

  await sendEmail({
    email,
    subject: `Verify your account`,
    message: `Your OTP is ${otp}`,
  });

  await sendOtp(otp, mobile);

  sendVerificationToken(
    res,
    user,
    201,
    "Verification code sent to your email and mobile"
  );
});

exports.verifyOtp = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId.trim() || !token.trim()) {
      return res.status(401).json({
        success: false,
        message: "Invalid Request, missing parameters!",
      });
    }
    if (!isValidObjectId(userId)) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid user id!" });
    }
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Sorry user not found!" });
    }
    if (user.verified) {
      return res
        .status(401)
        .json({ success: false, message: "Account already verified" });
    }

    const verifytoken = await Otp.findOne({
      owner: user._id,
      otpExpire: { $gt: Date.now() },
    });

    if (!verifytoken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid otp or has been expired" });
    }

    const isMatched = await verifytoken.compareToken(token);

    if (!isMatched) {
      return res.status(401).json({ success: false, message: "Wrong OTP" });
    }

    user.verified = true;

    await Otp.findByIdAndDelete(verifytoken._id);

    await user.save();

    await UserDefaultHome.create({
      userId: user._id,
    });

    sendToken(res, user, 200, "Account Verified");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// User login web with email password

exports.userLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new ErrorHandler("Both fields are required!", 400));
    }

    let user = await User.findOne({ email: username }).select("+password");

    if (!user) {
      user = await User.findOne({ mobile: username }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Wrong credentials!", 401));
      }
      const isPasswordMatched = await user.comparePassword(password);
      ////console.log("checked");
      if (!isPasswordMatched) {
        return next(new ErrorHandler("Wrong credentials!", 401));
      }
      if (!user.verified) {
        return next(new ErrorHandler("User Not Verfied", 401));
      }
      sendToken(res, user, 200, "Login Success");
    } else {
      ////console.log(user);
      user = await User.findOne({ email: username }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Wrong credentials!", 401));
      }
      if (!user.verified) {
        return next(new ErrorHandler("User Not Verfied", 401));
      }
      const isPasswordMatched = await user.comparePassword(password);
      ////console.log("checked");
      if (!isPasswordMatched) {
        return next(new ErrorHandler("Wrong credentials!", 401));
      }

      sendToken(res, user, 200, "Login Success");
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});
// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { username } = req.body;
  if (!username) {
    return next(new ErrorHandler("User not found", 400));
  }

  let user = await User.findOne({ email: username });

  if (!user) {
    user = await User.findOne({ mobile: username });
    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }
    if (!user.verified) {
      return next(new ErrorHandler("User Not Verfied", 401));
    }
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    let verificationOtpToken = new Otp({
      owner: user._id,
      token: otp,
    });

    await verificationOtpToken.save();
    sendOtp(otp, user.mobile);

    res.status(200).json({
      success: true,
      message: "Otp sent to your phone",
      user,
    });
  } else {
    ////console.log(user);
    user = await User.findOne({ email: username });
    if (!user) {
      return next(new ErrorHandler("User Not found", 401));
    }
    if (!user.verified) {
      return next(new ErrorHandler("User Not Verfied", 401));
    }
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    let verificationOtpToken = new Otp({
      owner: user._id,
      token: otp,
    });

    await verificationOtpToken.save();

    await sendEmail({
      email: user.email,
      subject: `Reset Password OTP`,
      message: `Your Reset Password OTP is ${otp}`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to you email",
      user,
    });
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { userId, token, newPassword, confirmPassword } = req.body;

  if (!userId || !token || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("Invalid Request, missing parameters!", 401));
  }
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 401));
  }
  if (!isValidObjectId(userId)) {
    return next(new ErrorHandler("Invalid user id!", 401));
  }
  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("Sorry user not found!", 401));
  }
  if (!user.verified) {
    return next(new ErrorHandler("User Not Verfied", 401));
  }

  const verifytoken = await Otp.findOne({
    owner: user._id,
    otpExpire: { $gt: Date.now() },
  });

  if (!verifytoken) {
    return next(new ErrorHandler("Invalid otp or has been expired", 401));
  }

  const isMatched = await verifytoken.compareToken(token);

  if (!isMatched) {
    return next(new ErrorHandler("Wrong OTP", 401));
  }

  user.password = newPassword;

  await Otp.findByIdAndDelete(verifytoken._id);

  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Password reset fuccessfully" });
});

// create Home
exports.createHome = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new ErrorHandler("Parameters requiered", 401));
  }
  if (!isValidObjectId(userId)) {
    return next(new ErrorHandler("Invalid Parmeter", 401));
  }
  let user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 401));
  }

  const userHome = await UserDefaultHome.findOne({ userId });

  //console.log(userHome);

  if (!userHome) {
    userHome.create({
      userId,
    });
    res.status(201).json({ success: true, message: "Home Created", userHome });
    return;
  }

  res
    .status(201)
    .json({ success: true, message: "Already Available", userHome });
});

// update home
exports.updateHome = catchAsyncErrors(async (req, res, next) => {
  const { userId, name } = req.body;

  if (!name || !userId) {
    return next(new ErrorHandler("Feilds Required", 401));
  }
  let home = await UserDefaultHome.findOne({ userId });
  if (!home) {
    return next(new ErrorHandler("Home Not Found", 401));
  }

  home.name = name;

  await home.save();

  res.status(201).json({ success: true, message: "Room Saved" });
});

// Create Room
exports.createRoom = catchAsyncErrors(async (req, res, next) => {
  const { roomname, userId } = req.body;

  if (!roomname || !userId) {
    return next(new ErrorHandler("Feilds Required", 401));
  }

  let rooms = await UserRoom.findOne({ roomname, userId });

  if (rooms) {
    return next(new ErrorHandler("Room Name Already There"), 401);
  }

  rooms = await UserRoom.create({
    roomname,
    userId,
  });

  res.status(201).json({ success: true, message: "Room Created", rooms });
});
// update Room name
exports.updateRoomName = catchAsyncErrors(async (req, res, next) => {
  const { roomname, roomId } = req.body;

  if (!roomname || !roomId) {
    return next(new ErrorHandler("Feilds Required", 401));
  }
  let rooms = await UserRoom.findById(roomId);
  if (!rooms) {
    return next(new ErrorHandler("Room Not Found", 401));
  }

  rooms.roomname = roomname;

  await rooms.save();

  res.status(201).json({ success: true, message: "Room Saved", rooms });
});
// assign controller to room
// when room available
exports.finaltepWithRoomAvailable = catchAsyncErrors(async (req, res, next) => {
  const { userId, roomId, controllerId, controllerName } = req.body;

  if (!userId || !roomId || !controllerId || !controllerName) {
    return next(new ErrorHandler("Feilds Required", 401));
  }
  await UserRoom.findByIdAndUpdate(roomId, {
    $push: { controllers: controllerId },
  });
  await Controller.findByIdAndUpdate(controllerId, {
    name: controllerName,
    roomId,
  });

  res
    .status(200)
    .json({ success: true, message: `Device Configured Successfully` });
});
// assign controller to room
// when room available
exports.finaltepWithoutRoomAvailable = catchAsyncErrors(
  async (req, res, next) => {
    const { userId, roomname, controllerId, controllerName } = req.body;

    if (!userId || !roomname || !controllerId || !controllerName) {
      return next(new ErrorHandler("Feilds Required", 401));
    }

    let rooms = await UserRoom.create({
      roomname,
      userId,
      controllers: [controllerId],
    });
    if (!rooms) {
      return next(
        new ErrorHandler("Somthin wrong Happent please try again", 500)
      );
    }
    await Controller.findByIdAndUpdate(controllerId, {
      name: controllerName,
      roomId: rooms._id,
    });

    res.status(201).json({
      success: true,
      message: "Device Configured Successfully",
    });
  }
);

// get rooms
exports.getRooms = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  //console.log(req.params);

  if (!userId || userId === undefined) {
    return next(new ErrorHandler("Parameters Missing", 401));
  }
  let rooms = await UserRoom.find({ userId });
  if (rooms.length == 0) {
    return next(new ErrorHandler("Rooms Not Found", 401));
  }

  res.status(201).json({ success: true, message: "Room Found", rooms });
});

//  (configure Device)

exports.configureDevice = catchAsyncErrors(async (req, res, next) => {
  const { controllerId, userId, controllerTypeId } = req.body;
  //console.log(req.body);

  if (!controllerId) {
    return next(new ErrorHandler("Please Enter Controller ID", 401));
  }

  if (!userId) {
    return next(new ErrorHandler("User Id should not empty", 401));
  }

  if (!controllerTypeId) {
    return next(new ErrorHandler("Device Type id should not empty", 401));
  }
  let user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 401));
  }

  // check device Id
  let controller = await Controller.findOne({ controllerId });
  if (!controller) {
    return next(new ErrorHandler("Controller Id Invalid", 401));
  }
  if (controller.controllerTypeId != controllerTypeId) {
    return next(new ErrorHandler("Device Type Not Mached", 401));
  }
  if (controller.assigned === true) {
    return next(new ErrorHandler("Already Assigned to someone", 401));
  }
  //console.log("why comes here");

  controller.assigned = true;
  controller.assignedUser = user._id;
  controller.activatedAt = Date.now();

  await controller.save();

  res.status(200).json({
    success: true,
    message: `"Device successfully assigned to ${user.name}"`,
    controller,
  });
});

// checking client for ws connection
exports.checkClient = async (userId) => {
  try {
    let user = await User.findById(userId);
    if (!user) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};
