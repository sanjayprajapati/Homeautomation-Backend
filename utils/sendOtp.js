const sendOtp = (otp, mobile) => {
  const sid = process.env.ACCOUNT_SID;
  const authtoken = process.env.AUTH_TOKEN;
  const twilloNum = process.env.ACCOUNT_NUMBER;
  const twilio = require("twilio")(sid, authtoken);

  twilio.messages
    .create({
      from: twilloNum,
      to: `+91${mobile}`,
      body: `Your One Time Password is ${otp}. Do not share with anyone.`,
    })
    .then(function (res) {
      console.log("Otp send successfylly");
      //res.json({ success: true, message });
    })
    .catch(function (err) {
      verificationOtpToken.token = undefined;

      verificationOtpToken.save({ validateBeforeSave: false });
      console.log(err.message);
    });
};

module.exports = sendOtp;
