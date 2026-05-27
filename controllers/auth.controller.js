// const sendMailTo = require("../services/mail.service");
const asyncHandler = require("../utils/asyncHandler");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const {
  registerService,
  loginService,
  getAccessTokenService,
} = require("../services/auth.service");
const ApiResponse = require("../utils/apiResponse");

// REGISTER
let registerController = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, newUser } = await registerService(
    req.body,
  );

  // remove password from response
  newUser.password = undefined;

  // ACCESS TOKEN COOKIE
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 15 * 60 * 1000, // 15 min
  });

  // REFRESH TOKEN COOKIE
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res
    .status(201)
    .json(new ApiResponse("User registered successfully", newUser));
});

// LOGIN
let loginController = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, newUser } = await loginService(req.body);

  // remove password
  newUser.password = undefined;

  // ACCESS TOKEN
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 15 * 60 * 1000,
  });

  // REFRESH TOKEN
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res
    .status(200)
    .json(new ApiResponse("User login successful", newUser));
});

let getAccessTokenController = asyncHandler(async (req, res) => {
  let refreshToken = req.cookies.refreshToken;

  let accessToken = await getAccessTokenService(refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 15 * 60 * 1000,
  });

  return res.status(200).json(new ApiResponse("access token generated"));
});

// let forgetPasswordController = async (req, res) => {
//   try {
//     let { email } = req.body;

//     if (!email) {
//       return res.status(404).json({
//         message: "email not found",
//       });
//     }

//     let isExisted = await userModel.findOne({ email });

//     if (!isExisted) {
//       return res.status(404).json({
//         message: "User not found with this email",
//       });
//     }

//     let rawToken = jwt.sign({ id: isExisted._id }, process.env.JWT_SECRET, {
//       expiresIn: "15m",
//     });

//     let resetLink = `http://localhost:8000/api/auth/reset-password/${rawToken}`;

//     await sendMailTo(
//       email,
//       "reset-password",
//       `<a href=${resetLink}>Click here</a>`,
//     );

//     return res.status(200).json({
//       message: "mail sent sucessfully",
//     });
//   } catch (error) {
//     console.log("error in fp api", error);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// let resetPasswordController = async (req, res) => {
//   try {
//     let token = req.params.token;

//     if (!token) {
//       return res.status(400).json({
//         message: "invalid request",
//       });
//     }

//     let decode = await jwt.verify(token, process.env.JWT_SECRET);

//     if (!decode) {
//       return res.status(400).json({
//         message: "unauthorized request",
//       });
//     }

//     let user = await userModel.findById(decode.id);

//     if (!user) {
//       return res.status(404).json({
//         message: "invalid request",
//       });
//     }

//     return res.render("reset.ejs", { id: user._id });
//   } catch (error) {
//     console.log("error in reset", error);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// let setPasswordController = async (req, res) => {
//   let { newPassword, id } = req.body;

//   if (!newPassword || !id) {
//     return res.status(400).json({
//       message: "all fields are required",
//     });
//   }

//   let hashPass = await bcrypt.hash(newPassword, 10);

//   let user = await userModel.findByIdAndUpdate(
//     id,
//     { password: hashPass },
//     { new: true },
//   );

//   return res.status(200).json({
//     message: "password updated sucessfully",
//     user,
//   });
// };

module.exports = {
  registerController,
  loginController,
  getAccessTokenController,
  //   forgetPasswordController,
  //   resetPasswordController,
  //   setPasswordController,
};
