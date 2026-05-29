const userModel = require("../models/user.model");
let ApiError = require("../utils/apiError");
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");


// REGISTER SERVICE
let registerService = async (data) => {

  try {

    let {
      name,
      email,
      password,
    } = data;

    // validation
    if (!name || !email || !password) {
      throw new ApiError(
        400,
        "All fields are required"
      );
    }

    // check existing user
    let isExist = await userModel.findOne({
      email,
    });

    if (isExist) {
      throw new ApiError(
        409,
        "User already exists"
      );
    }

    // hash password
    let hashPass = bcrypt.hashSync(
      password,
      10
    );

    // create user
    let newUser = await userModel.create({
      name,
      email,
      password: hashPass,
    });

    // generate tokens
    let accessToken =
      generateAccessToken(newUser._id);

    let refreshToken =
      generateRefreshToken(newUser._id);

    // if refreshToken field exists in model
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // remove password
    newUser.password = undefined;

    return {
      accessToken,
      refreshToken,
      newUser,
    };

  } catch (error) {

    console.log(
      "Error in registerService",
      error
    );

    throw error;
  }
};




// LOGIN SERVICE
let loginService = async (data) => {

  try {

    let {
      email,
      password,
    } = data;

    // validation
    if (!email || !password) {
      throw new ApiError(
        400,
        "All fields are required"
      );
    }

    // find user
    let isExist = await userModel.findOne({
      email,
    });

    if (!isExist) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    // compare password
    let isMatch = bcrypt.compareSync(
      password,
      isExist.password
    );

    if (!isMatch) {
      throw new ApiError(
        401,
        "Invalid credentials"
      );
    }

    // generate tokens
    let accessToken =
      generateAccessToken(isExist._id);

    let refreshToken =
      generateRefreshToken(isExist._id);

    // if refreshToken field exists
    isExist.refreshToken = refreshToken;
    await isExist.save();

    // remove password
    isExist.password = undefined;

    return {
      accessToken,
      refreshToken,
      newUser: isExist,
    };

  } catch (error) {

    console.log(
      "Error in loginService",
      error
    );

    throw error;
  }
};





let getAccessTokenService = async(refreshToken)=>{
   if(!refreshToken) throw new ApiError(401, "unauthorized")
    
let decode = jwt.verify(refreshToken , process.env.REFRESH_TOKEN_SECRET);

let user = await userModel.findById(decode.id);
  if (!user) throw new ApiError(404, "user not found");


   if (refreshToken !== user.refreshToken)
    throw new ApiError(401, "Unauthorized request");

    let accessToken = generateAccessToken(user._id);

     return accessToken;
}


module.exports = {registerService , loginService , getAccessTokenService}
