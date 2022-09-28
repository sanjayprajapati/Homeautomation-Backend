const server = require("./app");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const logger = require("./logger/logger");
const { backup } = require("./utils/dbbackup");
// handling uncotch Expantions
process.on("warning", (e) => console.warn(e.stack));
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shuting Down the server due to uncaughtException`);
  console.log(err.stack);
  process.exit(1);
});

//config
if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({ path: "config/config.env" });
}
//db connection;
connectDB();
backup();
logger.error("error");
logger.warn("warn");
logger.info("info");
logger.verbose("verbose");
logger.debug("debug");
logger.silly("silly");
const httpws = server.listen(process.env.PORT, () => {
  logger.info(`Server Runing on Port: ${process.env.PORT}`);
});

// Unhandled Promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shuting Down the server due to Unhandled promise rejection`);

  httpws.close(() => {
    process.exit(1);
  });
});
