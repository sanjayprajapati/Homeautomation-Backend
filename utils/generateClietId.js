const { v4: uuidv4 } = require("uuid");
exports.generateClientId = () => {
  return uuidv4();
};
