const { isValidObjectId } = require("mongoose");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
exports.serverUpgrade = async (server, wss) => {
  server.on("upgrade", async function upgrade(request, socket, head) {
    try {
      console.log("request >>>>>>>>>>>>", request.url);
      if (request.url != "/wsapp") {
        let { appkey, deviceids, cookie, token } = request.headers;

        //console.log("upgrading", appkey, token);

        if (appkey === undefined) {
          //console.log("aapkey not found checking cookie");
          if (token === undefined) {
            // console.log("cookie not found");
            socket.destroy();
            return;
          }
          if (!isJson(token)) {
            console.log("cookie is not jsone");
            socket.destroy();
            return;
          }

          let { deviceids, userId, clientIds } = JSON.parse(token);
          console.log("clientIds", clientIds);
          if (!isValidObjectId(userId) || userId == undefined) {
            //console.log("not authorized");
            socket.destroy();
            return;
          }
          let clientData = {
            clientType: "response",
            deviceids,
            clientIds,
            userId: userId,
          };

          wss.handleUpgrade(request, socket, head, function done(ws) {
            //console.log("cookie setep2");
            wss.emit("connection", ws, request, clientData);
          });
        } else {
          if (appkey.length < 36) {
            console.log("not authorized");
            socket.destroy();
            return;
          }

          deviceids = deviceids.replace(/;/g, ",");

          console.log(deviceids);
          let clientData = {
            clientType: "request",
            deviceids,
            userId: appkey,
          };
          wss.handleUpgrade(request, socket, head, function done(ws) {
            console.log("controller setep2");
            wss.emit("connection", ws, request, clientData);
          });
        }
      } else {
        let { cookie } = request.headers;
        console.log(cookie);
        let msg = cookie.replace(/token=/g, "");

        const decodedData = jwt.verify(msg, process.env.JWT_SECRET);

        let user = await User.findById(decodedData.id);

        if (!user) {
          //console.log("not authorized");
          socket.destroy();
          return;
        }
        let clientData = {
          clientType: "ADMIN",
          deviceids: [],
          clientIds: [],
          userId: user._id,
        };

        wss.handleUpgrade(request, socket, head, function done(ws) {
          //console.log("cookie setep2");
          wss.emit("connection", ws, request, clientData);
        });
      }
    } catch (error) {
      //console.log(error);
      socket.destroy();
      return;
    }
  });
};
