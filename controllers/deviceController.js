//

const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Device = require("../models/Device");
const ErrorHandler = require("../utils/errorHandler");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const ControllerType = require("../models/ControllerType");
const Controller = require("../models/Controller");
const RoomType = require("../models/RoomType");
const UserRoom = require("../models/UserRoom");
const { response } = require("express");
const UserDefaultHome = require("../models/UserDefaultHome");
const Alarm = require("../models/Alarm");
const schedule = require("node-schedule");

exports.getAllDeviceByDeviceId = catchAsyncErrors(async (req, res, next) => {
  const controllerId = req.params.id;
  //console.log(controllerId);
  const device = await Device.find({ controllerId });
  if (!device) {
    return next(new ErrorHandler("Data not found"));
  }

  res.status(200).json({ success: true, message: "All devices found", device });
});
exports.updateAllDeviceByDeviceId = catchAsyncErrors(async (req, res, next) => {
  const { data } = req.body;
  let pawerState;
  const ids = data.map((item) => {
    pawerState = item.pawerState;
    return item.deviceId;
  });

  await Device.updateMany({ _id: { $in: ids } }, { pawerState: pawerState });

  res.status(200).json({ success: true, message: "All devices updated" });
});

exports.updateAllDeviceByRoomId = catchAsyncErrors(async (req, res, next) => {
  const { roomId, pawerState } = req.params;

  let rooms = await UserRoom.findById(roomId);

  let controllerIds = rooms.controllers;

  let device = await Device.updateMany(
    {
      controllerId: controllerIds,
    },
    {
      $set: {
        pawerState,
      },
    }
  );

  res
    .status(200)
    .json({ success: true, message: "All devices updated", device });
});

exports.getSingleDeviceById = catchAsyncErrors(async (req, res, next) => {
  //console.log(req.params.id);
  const device = await Device.findById(req.params.id);
  if (!device) {
    return next(new ErrorHandler("Data not found", 401));
  }

  res.status(200).json({ success: true, message: "Device Found", device });
});

exports.updateSingleDeviceById = catchAsyncErrors(async (req, res, next) => {
  const { id, homeScreen, name, iconType } = req.body;
  console.log(req.body);

  if (!id || !name || !iconType) {
    console.log(name);
    return next(new ErrorHandler("Somthing Worng", 401));
  }
  console.log("ddddd");
  const device = await Device.findById(id);

  device.name = name;
  device.homeScreen = homeScreen;
  device.iconType = iconType;

  await device.save();

  res.status(200).json({ success: true, message: "Device Updated", device });
});

// get Device tye
exports.getDeviceTye = catchAsyncErrors(async (req, res, next) => {
  let devicetype = await ControllerType.find();

  if (!devicetype) {
    return next(
      new ErrorHandler("There no device type found in Database", 401)
    );
  }

  res
    .status(200)
    .json({ success: true, message: "Device type found", devicetype });
});

// get Device tye
exports.getContollerId = catchAsyncErrors(async (req, res, next) => {
  let { controllerId, controllerTypeId } = req.body;
  //console.log(req.body);
  let conroller = await Controller.findOne({ controllerId });

  if (!conroller) {
    return next(new ErrorHandler("Device Id invalid", 401));
  }
  if (conroller.controllerTypeId != controllerTypeId) {
    return next(new ErrorHandler("Device Type Not Mached", 401));
  }

  if (conroller.assigned) {
    return next(new ErrorHandler("Device Id already assigned to someone", 401));
  }

  res
    .status(200)
    .json({ success: true, message: "Device Id found", conroller });
});

// final updation of controller with name
exports.updateController = catchAsyncErrors(async (req, res, next) => {
  let { id, name, roomtypeId } = req.body;
  //console.log(req.body);
  let controller = await Controller.findById(id);

  if (!controller) {
    return next(
      new ErrorHandler("No device found something worng try again", 401)
    );
  }

  controller.name = name;

  res
    .status(200)
    .json({ success: true, message: "Updated successfully", controller });
});

exports.getControllerWithRoomName = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  //console.log(req.params);

  if (!userId) {
    return next(new ErrorHandler("Fiels are blank", 401));
  }

  // check device Id
  let controller = await Controller.find({
    assignedUser: userId,
    assigned: true,
  });

  //console.log(controller);

  if (controller.length == 0) {
    return next(new ErrorHandler("No Device Added Yet!"), 404);
  }
  // find rooms
  let newContArr = [];
  let contIds = [];
  for (let i = 0; i < controller.length; i++) {
    if ("roomId" in controller[i] && controller[i]["roomId"] != undefined) {
      newContArr.push(controller[i]);
      contIds.push(controller[i]._id.toString());
    }
  }
  //console.log("setep 2",newContArr, contIds);
  if (newContArr.length == 0 || contIds.length == 0) {
    return next(new ErrorHandler("No Device Added Yet!"), 404);
  }

  let rooms = await UserRoom.find({ userId });

  //console.log("setep r", rooms);

  let controllerWithRoom = [];
  for (let i = 0; i < rooms.length; i++) {
    //roomids.push(controller[i].roomTypeId);
    //console.log("controller id", rooms[i]._id);
    let conArr = [];
    for (let j = 0; j < newContArr.length; j++) {
      //console.log("room id", rooms[j]._id);
      if (rooms[i]._id.toString() === newContArr[j].roomId.toString()) {
        // //console.log("jjhh", j);
        // let deviceArr = [];
        // for (let k = 0; k < device.length; k++) {
        //   //console.log("in k loop");
        //   if (
        //     device[k].controllerId.toString() === newContArr[j]._id.toString()
        //   ) {
        //     // pushing devices in local device   array

        //     deviceArr.push(device[k]);
        //   }
        // }
        //pushing devices and   controller local conArr array
        // if (deviceArr.length > 0) {
        conArr.push({
          controllerId: newContArr[j]._id,
          controllername: newContArr[j].name,
          appkey: newContArr[j].appkey,
          appsecret: newContArr[j].appsecret,
          // divices: deviceArr,
        });
        // }
      }
    }
    // pushing data in main array
    if (conArr.length > 0) {
      controllerWithRoom.push({
        roomId: rooms[i]._id.toString(),
        roomname: rooms[i].roomname,
        controllers: conArr,
      });
    }
  }
  // //console.log(controllerWithRoom);

  //console.log(rooms);
  res.status(200).json({
    success: true,
    message: `All Controller found`,
    data: controllerWithRoom,
  });
});

exports.getAllDeviceByRoom = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  //console.log(req.params);

  if (!userId) {
    return next(new ErrorHandler("Fiels are blank", 401));
  }

  // check device Id
  let controller = await Controller.find({
    assignedUser: userId,
    assigned: true,
  });

  if (controller.length == 0) {
    return next(new ErrorHandler("Device Not Found"), 401);
  }
  // find rooms
  let newContArr = [];
  let contIds = [];
  for (let i = 0; i < controller.length; i++) {
    if (
      "roomTypeId" in controller[i] &&
      controller[i]["roomTypeId"] != undefined
    ) {
      newContArr.push(controller[i]);
      contIds.push(controller[i]._id.toString());
    }
  }

  //console.log(newContArr);

  // find device devices
  let device = await Device.find().where("controllerId").in(contIds);
  //console.log(device);
  let rooms = await RoomType.find({});
  let roomids = [];
  let controllerWithRoom = [];
  for (let i = 0; i < rooms.length; i++) {
    //roomids.push(controller[i].roomTypeId);
    //console.log("controller id", rooms[i]._id);
    let conArr = [];
    let deviceArr = [];
    for (let j = 0; j < newContArr.length; j++) {
      //console.log("room id", rooms[j]._id);

      if (rooms[i]._id.toString() === newContArr[j].roomTypeId.toString()) {
        //console.log("jjhh", j);

        for (let k = 0; k < device.length; k++) {
          //console.log("in k loop");
          if (
            device[k].controllerId.toString() === newContArr[j]._id.toString()
          ) {
            // pushing devices in local device   array

            deviceArr.push(device[k]);
          }
        }
        //pushing devices and   controller local conArr array
        // if (deviceArr.length > 0) {
        //   conArr.push({
        //     divices: deviceArr,
        //   });
        // }
      }
    }
    // pushing data in main array
    if (deviceArr.length > 0) {
      controllerWithRoom.push({
        roomId: rooms[i]._id.toString(),
        roomname: rooms[i].roomtype,
        divices: deviceArr,
      });
    }
  }
  // //console.log(controllerWithRoom);

  //console.log(rooms);
  res.status(200).json({
    success: true,
    message: `All Controller found`,
    data: controllerWithRoom,
  });
});
exports.getAllDeviceByQueryParms = catchAsyncErrors(async (req, res, next) => {
  const { userId, roomId } = req.query;
  let objLength = Object.keys(req.query).length;
  // //console.log(objLength);
  if (objLength == 0) {
    return next(new ErrorHandler("Parameters Required", 401));
  } else if (objLength == 1) {
    if (!userId || userId == undefined) {
      return next(new ErrorHandler("Parameters in vailid", 401));
    }
    //return;

    // check device Id
    let controller = await Controller.find({
      assignedUser: userId,
      assigned: true,
    });

    if (controller.length == 0) {
      return next(new ErrorHandler("Data not found", 404));
    }

    // find rooms
    let newContArr = [];
    let contIds = [];
    for (let i = 0; i < controller.length; i++) {
      if ("roomId" in controller[i] && controller[i]["roomId"] != undefined) {
        newContArr.push(controller[i]);
        contIds.push(controller[i]._id.toString());
      }
    }

    //console.log(newContArr);

    // find device devices
    let device = await Device.find().where("controllerId").in(contIds);
    //console.log(device);
    let rooms = await UserRoom.find({ userId });
    //console.log(rooms);
    let roomids = [];
    let controllerWithRoom = [];
    for (let i = 0; i < rooms.length; i++) {
      //roomids.push(controller[i].roomTypeId);
      //console.log("controller id", rooms[i]._id);
      let conArr = [];
      let deviceArr = [];
      for (let j = 0; j < newContArr.length; j++) {
        //console.log("room id", rooms[j]._id);

        if (rooms[i]._id.toString() === newContArr[j].roomId.toString()) {
          // //console.log("jjhh", j);

          for (let k = 0; k < device.length; k++) {
            // //console.log("in k loop");
            if (
              device[k].controllerId.toString() === newContArr[j]._id.toString()
            ) {
              // pushing devices in local device   array

              deviceArr.push(device[k]);
            }
          }
          //pushing devices and   controller local conArr array
          // if (deviceArr.length > 0) {
          //   conArr.push({
          //     divices: deviceArr,
          //   });
          // }
        }
      }
      // pushing data in main array
      if (deviceArr.length > 0) {
        controllerWithRoom.push({
          roomId: rooms[i]._id.toString(),
          roomname: rooms[i].roomname,
          divices: deviceArr,
        });
      }
    }
    // //console.log(controllerWithRoom);

    //console.log(rooms);
    res.status(200).json({
      success: true,
      message: `All Controller found`,
      data: controllerWithRoom,
      device,
    });
  } else if (objLength == 2) {
    if ((!userId || userId == undefined, !roomId || roomId == undefined)) {
      return next(new ErrorHandler("Parameters in vailid", 401));
    }
    //return;

    // check device Id
    let controller = await Controller.find({
      assignedUser: userId,
      assigned: true,
      roomId: roomId,
    });
    // //console.log(controller);
    if (controller.length == 0) {
      return next(new ErrorHandler("Data not found 1", 404));
    }

    // res.status(200).json({ controller });
    // return;

    // find rooms
    let newContArr = [];
    let contIds = [];
    for (let i = 0; i < controller.length; i++) {
      newContArr.push(controller[i]);
      contIds.push(controller[i]._id.toString());
    }

    // res.status(200).json({ contIds });
    // return;

    //console.log(newContArr);

    // find device devices
    let device = await Device.find().where("controllerId").in(contIds);
    // res.status(200).json({ controllerId: device });
    // return;
    let rooms = await UserRoom.findById(roomId);
    // res.status(200).json({ rooms });
    // return;
    let roomids = [];
    let controllerWithRoom = [];

    let conObj = {};
    let deviceArr = [];
    for (let i = 0; i < newContArr.length; i++) {
      //console.log("room id", rooms[j]._id);

      if (rooms._id.toString() === newContArr[i].roomId.toString()) {
        // //console.log("jjhh", i);

        for (let j = 0; j < device.length; j++) {
          //console.log("in k loop");
          if (
            device[j].controllerId.toString() === newContArr[i]._id.toString()
          ) {
            // pushing devices in local device   array

            deviceArr.push({
              _id: device[j]._id.toString(),
              roomId: rooms._id.toString(),
              roomname: rooms.roomname,
              controllerId: device[j].controllerId.toString(),
              name: device[j].name,
              pawerState: device[j].pawerState,
              iconType: device[j].iconType,
              createAt: device[j].createAt,
            });
          }
        }
      }
    }
    // pushing data in main array
    // if (deviceArr.length > 0) {
    //   controllerWithRoom.push({
    //     roomId: rooms._id.toString(),
    //     roomname: rooms.roomname,
    //     divices: deviceArr,
    //   });
    // }

    // //console.log(controllerWithRoom);

    //console.log(rooms);
    res.status(200).json({
      success: true,
      message: `All Devices fond in ${rooms.roomname}`,
      data: deviceArr,
    });
  } else {
    return next(new ErrorHandler("Not Authorized"), 401);
  }
});

// for testing
exports.getAllController = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  //console.log(userId);

  if (!userId || userId == undefined) {
    return next(new ErrorHandler("Parameters in vailid", 401));
  }
  //return;

  // check device Id
  let controller = await Controller.find({
    assignedUser: userId,
    assigned: true,
  });

  if (controller.length == 0) {
    return next(new ErrorHandler("Data not found", 404));
  }

  // find rooms
  let newContArr = [];

  for (let i = 0; i < controller.length; i++) {
    if ("roomId" in controller[i] && controller[i]["roomId"] != undefined) {
      newContArr.push(controller[i]);
    }
  }
  if (newContArr.length > 0) {
    res.status(200).json({
      success: true,
      message: `All Controller found`,
      controller: newContArr,
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Controller Not Found`,
    });
  }
});
exports.getAllDeviceIds = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  //console.log(userId);

  if (!userId || userId == undefined) {
    return next(new ErrorHandler("Parameters in vailid", 401));
  }
  //return;

  // check device Id
  let controller = await Controller.find({
    assignedUser: userId,
    assigned: true,
  });

  //console.log(controller);

  if (controller.length == 0) {
    // res
    //   .status(200)
    //   .json({ success: false, message: "No Device Added Yet", deviceids: [] });
    return next(new ErrorHandler("No Device Added Yet", 404));
  }

  // find rooms
  let contIds = [];

  for (let i = 0; i < controller.length; i++) {
    if ("roomId" in controller[i] && controller[i]["roomId"] != undefined) {
      contIds.push(controller[i]._id);
    }
  }
  let device = await Device.find().where("controllerId").in(contIds);

  if (device.length == 0) {
    return next(new ErrorHandler("Data not found", 404));
  }

  let deviceids = [];

  for (let i = 0; i < device.length; i++) {
    deviceids.push(device[i]._id);
  }

  res
    .status(200)
    .json({ success: true, message: "Data Found", deviceids: deviceids });
});

// Add User Devices data Home, rooms, controllers,devices
exports.getAllData = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  console.log(req.params);

  if (!userId || userId == undefined) {
    return next(new ErrorHandler("Parameters in vailid", 401));
  }
  //return;
  let deviceids = [];
  let devices = [];
  let home = await UserDefaultHome.find({ userId });
  let rooms = await UserRoom.find({ userId });
  // check device Id
  let controller = await Controller.find({
    assignedUser: userId,
    assigned: true,
  });

  if (controller.length == 0) {
    res.status(200).json({
      success: true,
      message: "No Device Added Yet!",
      data: { deviceids, devices, home, controller, rooms },
    });
    return;
  }

  // find rooms
  let newContArr = [];
  let contIds = [];
  for (let i = 0; i < controller.length; i++) {
    if ("roomId" in controller[i] && controller[i]["roomId"] != undefined) {
      newContArr.push(controller[i]);
      contIds.push(controller[i]._id.toString());
    }
  }

  //console.log(newContArr);

  // find device devices
  let device = await Device.find().where("controllerId").in(contIds);
  //console.log(device);

  //console.log(rooms);
  let alld = [];
  let controllerWithRoom = [];
  for (let i = 0; i < rooms.length; i++) {
    //roomids.push(controller[i].roomTypeId);
    //console.log("controller id", rooms[i]._id);
    let conArr = [];
    let deviceArr = [];

    for (let j = 0; j < newContArr.length; j++) {
      //console.log("room id", rooms[j]._id);

      if (rooms[i]._id.toString() === newContArr[j].roomId.toString()) {
        // //console.log("jjhh", j);

        for (let k = 0; k < device.length; k++) {
          // //console.log("in k loop");
          if (
            device[k].controllerId.toString() === newContArr[j]._id.toString()
          ) {
            // pushing devices in local device   array

            deviceArr.push(device[k]);
            deviceids.push(device[k]._id.toString());
            alld.push({
              roomId: rooms[i]._id.toString(),
              roomname: rooms[i].roomname,
              _id: device[k]._id.toString(),
              name: device[k].name,
              pawerState: device[k].pawerState,
              homeScreen: device[k].homeScreen,
              iconType: device[k].iconType,
              controllerId: device[k].controllerId,
              online: false,
            });
          }
        }
        //pushing devices and   controller local conArr array
        // if (deviceArr.length > 0) {
        //   conArr.push({
        //     divices: deviceArr,
        //   });
        // }
      }
    }
    // pushing data in main array
    if (deviceArr.length > 0) {
      controllerWithRoom.push({
        roomId: rooms[i]._id.toString(),
        roomname: rooms[i].roomname,
        divices: deviceArr,
      });
    }
  }
  // //console.log(controllerWithRoom);

  //console.log(rooms);
  res.status(200).json({
    success: true,
    message: `Data Found`,

    data: {
      deviceids,
      devices: controllerWithRoom,
      home,
      controller,
      rooms,
      alldevices: alld,
    },
  });
});

exports.addAlarm = catchAsyncErrors(async (req, res, next) => {
  const { name, weekday, deviceId, hours, minutes, action } = req.body;

  console.log(req.body);

  if (
    !name ||
    !weekday ||
    !deviceId ||
    hours == undefined ||
    minutes == undefined ||
    !action
  ) {
    return next(new ErrorHandler("Fields Required", 401));
  }

  let day = [];
  for (let i = 0; i < weekday.length; i++) {
    day.push({ day: weekday[i].day, value: weekday[i].value });
  }

  let time = hours * 3600 + minutes * 60 + 0;
  let alarm = await Alarm.create({
    name,
    deviceId,
    action,
    days: [...day],
    time: time,
  });

  res.status(201).json({ success: true, message: "Alarm Added Succesfuly" });
});

exports.getAlarm = catchAsyncErrors(async (req, res, next) => {
  const { deviceIds } = req.body;

  console.log(req.body);

  if (!deviceIds) {
    return next(new ErrorHandler("Fields Required", 401));
  }

  let alarm = await Alarm.find().where("deviceId").in(deviceIds);

  res.status(200).json({ success: true, message: "Found Alarms", alarm });
});

exports.editAlarm = catchAsyncErrors(async (req, res, next) => {
  const { name, weekday, id, hours, minutes, action, enabled } = req.body;

  console.log(req.body);

  if (
    !name ||
    !weekday ||
    !id ||
    hours == undefined ||
    minutes == undefined ||
    !action
  ) {
    console.log(req.body);
    return next(new ErrorHandler("Fields Required", 401));
  }
  let day = [];
  for (let i = 0; i < weekday.length; i++) {
    day.push({ day: weekday[i].day, value: weekday[i].value });
  }

  let time = hours * 3600 + minutes * 60 + 0;

  let alarm = await Alarm.findById(id);

  alarm.name = name;
  alarm.time = time;
  alarm.days = day;
  alarm.action = action;
  alarm.enabled = enabled;

  await alarm.save();

  var joblist = schedule.scheduledJobs;

  if (schedule.scheduledJobs[id]) {
    console.log("yes canceling jog");
    schedule.scheduledJobs[id].cancel();
  }

  res.status(200).json({ success: true, message: "Alarm Saved" });
});

exports.deleteAlarm = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.body;

  console.log(req.body);
  if (!id) {
    return next(new ErrorHandler("Fields Required", 401));
  }

  var joblist = schedule.scheduledJobs;

  if (schedule.scheduledJobs[id]) {
    console.log("yes canceling jog");
    schedule.scheduledJobs[id].cancel();
  }

  await Alarm.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Device Deleted" });
});

exports.testing = catchAsyncErrors(async (req, res, next) => {
  let appkey = "fbffc3b9-578f-48cb-84a1-4275fcb3a495";
  let deviceids = ["62c7d2970aec232058f7d027", "62b31f7a0aec232058ee0018"];
  let sdkVersion = "1.2.3";
  let restoreStates = true;
  let srt = uuidv4() + "-" + uuidv4();
  //console.log(appkey.length);

  const ws = new WebSocket("wss://origin8home.herokuapp.com", {
    headers: {
      appkey,
      deviceids: deviceids.join(";"),
      platform: "nodejs",
      sdkversion: sdkVersion,
      restoredevicestates: restoreStates,
    },
  });

  ws.on("open", function open() {
    //console.log("connection open");
    ws.send(
      JSON.stringify({
        deviceId: "62c7d2970aec232058f7d027",
        state: "Off",
      })
    );
  });

  ws.on("message", function message(data) {
    //console.log("received: %s", data);
  });
  if (ws) {
    //console.log("jaiho");
    ws.send(
      JSON.stringify({ deviceId: "62b31f7a0aec232058ee0018", state: "Off" })
    );
  }

  res.status(200).json({ success: true, message: "HO gaya" });
});
