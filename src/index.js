//require('dotenv').config()

import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'API Keys' above to copy your API secret
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGODB CONNECTION FAILED!!", error);
  });

/*  WE MODULARIZE THIS BY SHIFTING IT TO db/index.js

import express from "express";
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERROR:", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server listening at port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
})();
*/
