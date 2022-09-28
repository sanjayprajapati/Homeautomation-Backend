const sendVerificationToken = (res, user, statusCode, message) => {
  const verifyUserToken = user.getUserVerificationToken();

  const options = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.JWT_VERIFICATION_COOKIE_EXPIRE * 60 * 60 * 1000
    ),
  };

  const userData = {
    _id: user._id,
    verified: user.verified,
  };

  res
    .status(statusCode)
    .cookie("verifyUserToken", verifyUserToken, options)
    .json({ success: true, message, user: userData, verifyUserToken });
};

module.exports = sendVerificationToken;
