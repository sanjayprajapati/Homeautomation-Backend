const ErrorHandler = require("../utils/errorHandler");
const { isValidObjectId } = require("mongoose");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { getGeneratedControllerId } = require("../utils/getGenratedDeviceId");
const RoomType = require("../models/RoomType");
const User = require("../models/User");
const Device = require("../models/Device");
const ControllerType = require("../models/ControllerType");
const Controller = require("../models/Controller");
const { v4: uuidv4 } = require("uuid");
const sendToken = require("../utils/sendToken");
const fs = require("fs");
const header = require("../downloads/flileHeader");
const footer = require("../downloads/fileFooter");
const { createFile } = require("../utils/createFile");

// User Registration

// User login web with email password

exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new ErrorHandler("Both fields are required!", 400));
    }

    let user = await User.findOne({ email: username });

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
      if (user.role !== "ADMIN") {
        return next(new ErrorHandler("Unauthorized User!", 401));
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
exports.adminDetail = catchAsyncErrors(async (req, res, next) => {
  //console.log(req.user);

  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  //console.log(req.user);

  let users = await User.find({}).where("role").equals("USER");

  //console.log(users);

  res.status(200).json({
    success: true,
    users,
  });
});

// Create Device type

exports.createControllerType = catchAsyncErrors(async (req, res, next) => {
  const { name, applianceType } = req.body;
  let numOfAppliance = Number(applianceType[0].numberOfAppliance);
  let nameOfAppliance = applianceType[0].applianceName;

  if (!name || !nameOfAppliance) {
    return next(new ErrorHandler("All Fields are required", 401));
  }

  if (numOfAppliance === 0 || numOfAppliance === null) {
    return next(
      new ErrorHandler("Number of Applince must be a Number greater than 4"),
      401
    );
  }

  if (numOfAppliance <= 0 || numOfAppliance > 8) {
    return next(new ErrorHandler("Device Type must a number between 0-9", 401));
  }

  await ControllerType.create({
    name,
    applianceType,
  });

  res
    .status(201)
    .json({ success: true, message: "Controller Type Created Successfully" });
});

exports.getControllerType = catchAsyncErrors(async (req, res, next) => {
  //console.log(req);
  let controllerType = await ControllerType.find();
  //console.log(controllerType);

  res.status(200).json({
    success: true,
    controllerType,
  });
});

exports.createController = catchAsyncErrors(async (req, res, next) => {
  let { controllerTypeId } = req.body;
  let userId = req.user;

  if (!controllerTypeId || !userId) {
    return next(new ErrorHandler("Fields Required", 401));
  }

  if (!isValidObjectId(controllerTypeId)) {
    return next(new ErrorHandler("Invalid device type", 401));
  }

  const controllerType = await ControllerType.findById(controllerTypeId);
  if (!controllerType) {
    return next(new ErrorHandler("Device type not found", 401));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }

  const udId = await getGeneratedControllerId();
  let appkey = uuidv4();
  let appsecret = uuidv4() + "-" + uuidv4();

  const controller = await Controller.create({
    name: controllerType.name,
    controllerId: udId,
    controllerTypeId: controllerType._id,
    assignedUser: user._id,
    appkey,
    appsecret,
  });

  try {
    fs.mkdirSync(`downloads/${controller._id}`);
    console.log("Directory is created.");
  } catch (err) {
    await Controller.findByIdAndDelete(controller._id);
    console.log(err);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
  // createing directory for Arduino code

  let devices;
  let numofdevice = null;
  if (controller._id !== "" || controller._id == undefined) {
    let deviceArray = [];
    let devicelname = [
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
    ];
    let devicefullname = "";
    let str = controllerType.applianceType[0].applianceName;
    let devicefname = str.charAt(0).toUpperCase() + str.slice(1);
    numofdevice = Number(controllerType.applianceType[0].numberOfAppliance);

    console.log(numofdevice);

    for (let i = 0; i < numofdevice; i++) {
      devicefullname = devicefname + " " + devicelname[i];
      let obj = {};

      obj["name"] = devicefullname;
      obj["controllerId"] = controller._id;
      obj["iconType"] = str;

      deviceArray.push(obj);
    }

    devices = await Device.insertMany(deviceArray);
  }
  let ids = devices.map((item) => {
    return item._id;
  });
  // creating file for download
  try {
    await createFile(numofdevice, controller, ids);
    console.log("File created.");
  } catch (err) {
    await Controller.findByIdAndDelete(controller._id);
    await Device.deleteMany({
      _id: {
        $in: ids,
      },
    });
    console.log(err);
    return next(new ErrorHandler("Internal Server Error", 500));
  }

  res.status(201).json({
    success: true,
    message: "Controller Id Created Successfully",
    controller,
    devices,
  });
});

exports.getAllControllers = catchAsyncErrors(async (req, res, next) => {
  //console.log(req);

  let controllers = await Controller.find({});

  res.status(200).json({ success: true, controllers });
});

exports.createRoomType = catchAsyncErrors(async (req, res, next) => {
  const { roomtype } = req.body;

  if (!roomtype) {
    return next(new ErrorHandler("Please Enter Room Type", 401));
  }

  const roomType = await RoomType.create({
    roomtype,
  });
  await roomType.save();

  res.status(201).json({ success: true, message: "Rooms Type Created" });
});

// Add Device (configure Device)

exports.creatDevice = catchAsyncErrors(async (req, res, next) => {
  const { controllerId, controllerTypeId } = req.body;
  let userId = req.user;

  if (!controllerId) {
    return next(new ErrorHandler("Please Enter Device ID", 401));
  }
  if (!controllerTypeId) {
    return next(new ErrorHandler("Device type should not enpty", 401));
  }

  // check controller Id
  let controller = await Controller.findById(controllerId);
  if (!controller) {
    return next(new ErrorHandler("Controller Id Invalid", 401));
  }
  if (controller.assigned === true) {
    return next(new ErrorHandler("Already Assigned to an other user", 401));
  }

  let user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 401));
  }
  let controllertype = await ControllerType.findById(controllerTypeId);

  if (!controllertype) {
    return next(new ErrorHandler("Controller Type Not Found", 401));
  }
  let devices = await Device.findOne({ controllerId });

  if (devices) {
    return next(new ErrorHandler("Devices Already Created", 401));
  }

  let deviceArray = [];
  let devicelname = [
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
  ];
  let devicefullname = "";
  let str = controllertype.applianceType[0].applianceName;
  let devicefname = str.charAt(0).toUpperCase() + str.slice(1);
  let numofdevice = Number(controllertype.applianceType[0].numberOfAppliance);

  console.log(numofdevice);

  for (let i = 0; i < numofdevice; i++) {
    devicefullname = devicefname + " " + devicelname[i];
    let obj = {};

    obj["name"] = devicefullname;
    obj["controllerId"] = controllerId;
    obj["iconType"] = str;

    deviceArray.push(obj);
  }

  devices = await Device.insertMany(deviceArray);
  //await device.save();

  res.status(200).json({ success: true, devices });
});

// download file
exports.downloadFile = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  console.log(id);

  var filePath = `downloads/${id}/main.ino`; // Or format the path using the `id` rest param
  var fileName = "main.ino"; // The default name the browser will use

  res.download(filePath, fileName);
});
