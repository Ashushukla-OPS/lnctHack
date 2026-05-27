const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

let authMiddleware = async (req, res, next) => {
  try {
    // Get token
    let accessToken = req.cookies.accessToken;

    // Check token
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    // Verify token
    let decode = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    // Find user
    let user = await userModel
      .findById(decode.id)
      .select("-password -refreshToken");

    // User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.log("Error in auth middleware", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;