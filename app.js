const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const url = require("url");
const errorMiddleware = require("./middlewares/error");
const { v4: uuidv4 } = require("uuid");

const app = express();
//app.use(express.static(path.join(__dirname, "client/build")));

const server = http.createServer(app);

const wss = new WebSocket.Server({ noServer: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname + "/client/build")));
// importing routes
const admin = require("./routes/adminRoutes");
const user = require("./routes/userRoutes");
const device = require("./routes/deviceRoutes");
const room = require("./routes/roomsRoutes");
const { serverUpgrade } = require("./utils/serverUpgrade");
const { wssConnect } = require("./controllers/wssController");

app.use("/api/v1", admin);
app.use("/api/v1", user);
app.use("/api/v1", device);
app.use("/api/v1", room);
app.get("/testing", function (req, res) {
  res.send("testing");
  console.log("yes");
});

app.get("/*", (req, res) => {
  console.log("hit", req.headers.host);
  app.use(express.static(path.join(__dirname + "/client/build")));
});

// heartBeat function
function heartbeat() {
  this.isAlive = true;
}
// ws connect
wssConnect(wss);

// const interval = setInterval(function ping() {
//   wss.clients.forEach(function each(ws) {
//     console.log("function called");
//     if (ws.isAlive === false) {
//       console.log("closed");
//       return ws.terminate();
//     }

//     ws.isAlive = false;
//     ws.ping();
//   });
// }, 59000);

// wss.on("close", function close(ws) {
//   clients = clients.filter((item) => {
//     return item.id !== ws.id;
//   });
//   clearInterval(interval);
//   console.log("client disconnected");
// });

serverUpgrade(server, wss);

// Middleware for Errors working fine
app.use(errorMiddleware);

module.exports = server;
