const otpGenerator = require("otp-generator");
exports.getGeneratedDeviceId = function () {
  // Generating ID
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: true,
    lowerCaseAlphabets: true,
    specialChars: true,
  });
  return new Date().getTime().toString(36) + otp;
};
exports.getGeneratedControllerId = function () {
  // Generating ID
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: true,
    lowerCaseAlphabets: true,
    specialChars: true,
  });
  return new Date().getTime().toString(36) + otp;
};
