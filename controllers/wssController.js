const WebSocket = require("ws");
const { createReqClient, createResClient } = require("../utils/createClient");
const { serverUpgrade } = require("../utils/serverUpgrade");
const schedule = require("node-schedule");
const Alarm = require("../models/Alarm");
let rooms = {};
let roomId = null;
let deviceids = [];
let clients = [];
let jobs = [];
exports.wssConnect = (wss) => {
  const job = schedule.scheduleJob("*/20 * * * * *", async function () {
    console.log("Today is recognized by Rebecca Black!");
    let alarm = await Alarm.find();
    if (alarm.length > 0) {
      //console.log(jobs);
      alarm.forEach((item) => {
        if (item.enabled) {
          let scheduleId = `${item._id}`;
          let d = [];
          for (let i = 0; i < item.days.length; i++) {
            if (item.days[i].value == true) {
              d.push(i);
            }
          }

          //console.log(d);

          let payload = {
            header: {
              payloadVersion: 2,
              signatureVersion: 1,
            },
            payload: {
              action: "setPowerState",
              clientId: "portal",
              createdAt: Math.floor(Date.now() / 1000),
              deviceId: item.deviceId,
              message: "OK",
              replyToken: "516d4932-6461-4032-bccd-36e1f34c71d2",
              success: true,
              type: "request",
              value: {
                state: item.action,
              },
            },
            signature: {
              HMAC: "UyZwpj7tYfZI2ufi6RiHyhcChloByXs1GD8Iqu3wHzQ=",
            },
          };
          let hrs = Math.floor(item.time / 3600);
          let mnt = Math.floor((item.time - hrs * 3600) / 60);
          //console.log(hrs, mnt);
          //new Date(new Date().toUTCString());

          var rule = new schedule.RecurrenceRule();
          rule.tz = "Asia/Kolkata";
          rule.dayOfWeek = d;
          rule.hour = hrs;
          rule.minute = mnt;
          rule.second = 0;

          //console.log(rule);
          if (!schedule.scheduledJobs[scheduleId]) {
            schedule.scheduleJob(scheduleId, rule, function () {
              console.log("jaiho");
              wss.clients.forEach((client) => {
                if (
                  client.id.includes(item.deviceId) &&
                  client.clientType === "request" &&
                  client.readyState === WebSocket.OPEN
                ) {
                  client.send(JSON.stringify(payload));
                }
              });
            });
          }
        }
      });
    }
  });

  // upgrade server
  //serverUpgrade(server, wss);
  function noop() {}

  // heartBeat function
  function heartbeat() {
    this.isAlive = true;
  }

  wss.on("connection", function connection(ws, request, clientData) {
    const ip = request.socket.remoteAddress;
    //console.log("ippp", ip);
    let timestamp = Math.floor(Date.now() / 1000);
    ws.isAlive = true;
    let { deviceids, clientType, userId, clientIds } = clientData;
    //console.log(deviceids);
    ws.on("message", function sending(data, isBinary) {
      const { payload } = JSON.parse(data);
      console.log(payload.type);
      ////console.log("Device ID", payload.deviceId);
      clients.forEach(function each(client) {
        ////console.log(client.readyState + "======" + client.id);

        if (
          client !== ws &&
          client.id.includes(payload.deviceId) &&
          client.clientType === payload.type
        ) {
          //console.log("aayaaaaaaaaa");
          if (client.readyState === WebSocket.OPEN) {
            console.log("sending data to user");
            client.send(JSON.stringify(JSON.parse(data)));
          }
          if (client.readyState !== WebSocket.OPEN) {
            if (payload.type === "response") {
              console.log("updating data");
            }
          }
        }
        if (
          client !== ws &&
          client.id.includes(payload.deviceId) &&
          client.clientType === "response" &&
          payload.type === "event"
        ) {
          console.log("event sent");
          if (client.readyState === WebSocket.OPEN) {
            console.log("sending data to user");
            client.send(JSON.stringify(JSON.parse(data)));
          }
          if (client.readyState !== WebSocket.OPEN) {
            console.log("updating data");
          }
        }
      });
    });

    // user checkigng and assigning id to conneciton

    const existingClient = clients.find((client) => client.userId === userId);

    if (existingClient) {
      console.log("existing clien");

      if (existingClient.createdAt < timestamp) {
        clients = clients.filter((client) => {
          return client.userId !== userId;
        });

        if (clientType == "response") {
          ws.id = deviceids;
          ws.createdAt = timestamp;
          ws.clientType = clientType;
          ws.userId = userId;
          ws.clientId = clientIds;
          clients.push(ws);

          clients.forEach((client) => {
            //console.log("checking owner");
            if (client == ws && client.userId == userId) {
              console.log("got owner");
              //client.send(JSON.stringify({ deviceids, timestamp }));
              //let ids = deviceids.split(",");
              //console.log(ids);
              let list = [];
              for (let i = 0; i < clientIds.length; i++) {
                clients.map((cl) => {
                  console.log("list in");

                  if (
                    cl != ws &&
                    cl.userId == clientIds[i] &&
                    cl.readyState == WebSocket.OPEN
                  ) {
                    list.push(cl.id);
                  }
                });
              }

              client.send(JSON.stringify({ timestamp, clientList: list }));
            }
          });
        } else if (clientType == "ADMIN") {
          ws.id = deviceids;
          ws.createdAt = timestamp;
          ws.clientType = clientType;
          ws.userId = userId;
          ws.clientId = clientIds;
          clients.push(ws);

          clients.forEach((client) => {
            console.log("checking owner");
            if (client == ws && client.userId == userId) {
              console.log("got owner");
              //client.send(JSON.stringify({ deviceids, timestamp }));
              //let ids = deviceids.split(",");
              //console.log(ids);
              let list = [];
              for (let i = 0; i < clientIds.length; i++) {
                clients.map((cl) => {
                  console.log("list in");

                  if (cl != ws && cl.readyState == WebSocket.OPEN) {
                    list.push(cl.id);
                  }
                });
              }

              client.send(JSON.stringify({ timestamp, clientList: list }));
            }
          });
        } else {
          ws.id = deviceids;
          ws.createdAt = timestamp;
          ws.clientType = clientType;
          ws.userId = userId;
          ws.clientId = [];
          clients.push(ws);
          //console.log("pushing in clients array");
          //console.log("checking clients lenght", clients.length);
          clients.forEach((client) => {
            if (client != ws && client.clientId.includes(userId)) {
              console.log("got owner");
              let list = [deviceids];
              client.send(JSON.stringify({ timestamp, clientList: list }));
            }
          });
        }
      }
    } else {
      console.log("new clien");
      if (clientType == "response") {
        ws.id = deviceids;
        ws.createdAt = timestamp;
        ws.clientType = clientType;
        ws.userId = userId;
        ws.clientId = clientIds;
        clients.push(ws);

        clients.forEach((client) => {
          //console.log("checking owner");
          if (client == ws && client.userId == userId) {
            //console.log("got owner");
            //client.send(JSON.stringify({ deviceids, timestamp }));
            //let ids = deviceids.split(",");
            //console.log(ids);
            let list = [];
            for (let i = 0; i < clientIds.length; i++) {
              clients.map((cl) => {
                //console.log("list in");

                if (
                  cl != ws &&
                  cl.userId == clientIds[i] &&
                  cl.readyState == WebSocket.OPEN
                ) {
                  list.push(cl.id);
                }
              });
            }

            client.send(JSON.stringify({ timestamp, clientList: list }));
          }
        });
      } else if (clientType == "ADMIN") {
        ws.id = deviceids;
        ws.createdAt = timestamp;
        ws.clientType = clientType;
        ws.userId = userId;
        ws.clientId = clientIds;
        clients.push(ws);

        clients.forEach((client) => {
          console.log("checking owner");
          if (client == ws && client.userId == userId) {
            console.log("got owner");
            //client.send(JSON.stringify({ deviceids, timestamp }));
            //let ids = deviceids.split(",");
            //console.log(ids);
            let list = [];
            for (let i = 0; i < clientIds.length; i++) {
              clients.map((cl) => {
                console.log("list in");

                if (cl != ws && cl.readyState == WebSocket.OPEN) {
                  list.push(cl.id);
                }
              });
            }

            client.send(JSON.stringify({ timestamp, clientList: list }));
          }
        });
      } else {
        ws.id = deviceids;
        ws.createdAt = timestamp;
        ws.clientType = clientType;
        ws.userId = userId;
        ws.clientId = [];
        clients.push(ws);
        //console.log("pushing in clients array");
        //console.log("checking clients lenght", clients.length);
        clients.forEach((client) => {
          //console.log("checking owner", client.clientId.includes(userId));
          if (client != ws && client.clientId.includes(userId)) {
            console.log("got owner");
            let list = [deviceids];
            client.send(JSON.stringify({ timestamp, clientList: list }));
          }
        });
      }
    }

    ws.on("pong", heartbeat);
    // ws.on("close", function close(code, reason) {
    //   console.log("one client gone", code, reason);
    // });
    ws.on("error", function close(e) {
      console.log("eeeeeeeeeeeeee", e);
    });

    ws.send(JSON.stringify({ timestamp }));
    //exports.connections = wss.clients();
  });
  //end connection function

  const interval = setInterval(function ping() {
    // console.log("ping working");

    if (wss.clients.size > 0) {
      wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
          console.log("one clinet gone with userId", ws.userId);
          // console.log("befor", clients.length);
          clients = clients.filter((item) => {
            return item.userId != ws.userId;
          });

          //console.log("after", clients.length);
          clients.forEach((item) => {
            if (
              item.clientId.includes(ws.userId) &&
              item.readyState == WebSocket.OPEN
            ) {
              console.log("sendign closed client");
              item.send(JSON.stringify({ closedClient: [ws.id] }));
            }
          });

          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }
  }, 1000);

  wss.on("close", function close(data) {
    console.log("close ws info", data);
    clearInterval(interval);
  });

  // seduling message
  // if (jobs !== null) {
  //   jobs.forEach((job) => {
  //     console.log("job");
  //     schedule.scheduleJob("*/10 * * * * *", function () {
  //       console.log("here we send messgaes");
  //     });
  //   });
  // }
};
