import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation(not empty)
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object -> create entry in DB
  // remove password and refresh token from response
  // check for user creation(if successfully created)
  // return response

  //destructure and get fields from user req
  const { username, email, fullName, password } = req.body;
  //if any of the fields is empty after trim then returns true
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //find if user with same username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this username or email already exists");
  }

  //if req contains files then get path of avatar and cover image files stored locally using multer
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path; ------------------error

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //check if avatar file uplaoded....i.e file location found locally
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Avatar Upload failed, please retry");
  }

  //create DB entry of user
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //remove password and refreshToken from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "error while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

/*
. 
. 
. 
. 
. 
++++++++++++++++++++++++++++++++++++++++++++GENERATE TOKENS+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
. 
. 
. 
. 
. 
*/

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();

    //update user refreshtoken property
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

/*
. 
. 
. 
. 
. 
+++++++++++++++++++++++++++++++++++++++++++++++++++++LOGIN++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
. 
. 
. 
. 
. 
*/

const loginUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  // validation(non empty): username or email based
  // find username exits in db or name
  // password check
  // generate access and refresh token
  // send cookies with tokens

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], //returns true if either an entry with email or username exists in db
  });

  //check if user present in db
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  //cannot use our custom methods on User, as it has only mongodb properties.....user is our instance of db(which has our custom methods:isPasswordCorrect,etc)
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //current 'user' has password access and no refresh tokens as tokens only generated till now, not set
  //thus while sending response to user, must remove password and refreshtoken fields, as tokens will be sent via cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) //browser based auth
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, //attach user data to response
          accessToken, //mobile, bearer based auth
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

/*
. 
. 
. 
. 
. 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++LOGOUT++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
. 
. 
. 
. 
. 
*/

const logoutUser = asyncHandler(async (req, res) => {
  //find user in db using user id from req
  //set refreshtoken to undefined
  //clear cookies while returning response

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

export { registerUser, loginUser, logoutUser };
