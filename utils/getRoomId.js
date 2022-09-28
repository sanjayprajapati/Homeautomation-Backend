const Device = require("../models/Device");
const User = require("../models/User");
const UserRoom = require("../models/UserRoom");

exports.getRoomID = async (appkey, deviceids) => {
  //let { appkey, deviceids } = data;
  try {
    let user = await User.findOne({ appKey: appkey });
    if (!user) {
      console.log("3");
      return false;
    }
    deviceids = deviceids.split(";");
    let deviceId = deviceids[0];

    let device = await Device.findById(deviceids);

    if (!device) {
      console.log("4");
      return false;
    }
    //console.log(device);
    let rooms = await UserRoom.findOne({
      controllers: {
        $elemMatch: { controllerId: device.controllerId },
      },
    });

    if (!rooms) {
      console.log("5");
      return false;
    }
    console.log(rooms);

    return {
      roomID: rooms._id.toString(),
      userID: device.controllerId.toString(),
    };
  } catch (error) {
    console.log(error);
    return;
  }
};
