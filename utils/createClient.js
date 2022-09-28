function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
let resTypeClient = [];
let reqTypeClient = [];
exports.createReqClient = (clientData, ws) => {
  try {
    let { clientType, deviceids } = clientData;
    if (clientType === "request" && deviceids.length > 0) {
      let existReqClient = reqTypeClient.find(
        (client) => client.deviceids[0] === deviceids[0]
      );
      if (existReqClient) {
        console.log("Req client exist");
        return reqTypeClient;
      }
      console.log("Req arr pushing data");
      reqTypeClient.push({ clientType, deviceids: [...deviceids], con: ws });
      return reqTypeClient;
    }
  } catch (error) {
    console.log("Create client catch error: ", error);
    ws.send(
      JSON.stringify({
        success: false,
        timestamp: Math.floor(Date.now() / 1000),
      })
    );
  }
};

exports.createResClient = (clientData, ws) => {
  try {
    let { clientType, deviceids } = clientData;
    if (clientType === "response" && deviceids.length > 0) {
      let existResClient = resTypeClient.find(
        (client) => client.deviceids[0] === deviceids[0]
      );
      if (existResClient) {
        console.log("Res client exist");
        return resTypeClient;
      }
      console.log("Res arr pushing data");
      resTypeClient.push({ clientType, deviceids: [...deviceids], con: ws });
      return resTypeClient;
    }
  } catch (error) {
    console.log("Create client catch error: ", error);
    ws.send(
      JSON.stringify({
        success: false,
        timestamp: Math.floor(Date.now() / 1000),
      })
    );
  }
};
