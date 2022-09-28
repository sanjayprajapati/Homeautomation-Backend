var sid = "AC51b9621ee0bb5af27c7fe885fac8ff31";
var auth_token = "ed8e3f1e223ac2fe3f66301427264fe8";

var twilio = require("twilio")(sid, auth_token);

twilio.messages
  .create({
    from: "+18632165147",
    to: "+918826462790",
    body: "this is a testing message",
  })
  .then(function (res) {
    console.log("message has sent!");
  })
  .catch(function (err) {
    console.log(err);
  });
