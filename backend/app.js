"use strict";

// imports
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const user = require("./users/routes");
const master = require("./masters/routes");
const search = require("./search/routes");
const group = require("./groups/routes");
const cors = require("cors");
const config = require("./configuration/config");
// const path = require("path");
// const multer = require("multer");

// port number
const PORT = 3001;

// app
const app = express();

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(cors({ origin: config.frontendUrl, credentials: true }));

// // Set Storage Engine for Profile Images
// const profileImageStorage = multer.diskStorage({
//   destination: "./public/uploads/profile/",
//   filename: function (req, file, callback) {
//     callback(
//       null,
//       file.fieldname + "_" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });

// // Set Storage Engine for Group Images
// const groupImageStorage = multer.diskStorage({
//   destination: "./public/uploads/group/",
//   filename: function (req, file, callback) {
//     console.log("Inside");
//     callback(
//       null,
//       file.fieldname + "_" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });

// // Check file type
// const checkFileType = (file, callback) => {
//   console.log("INside");
//   const fileTypes = /jpeg|hpg|png|gif/;
//   const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = fileTypes.test(file.mimetype);
//   if (extname && mimetype) {
//     return callback(null, true);
//   } else {
//     return callback("Images Only!");
//   }
// };

// // Initialize upload variable for uploading profile images
// const uploadProfileImage = multer({
//   storage: profileImageStorage,
//   fileFilter: function (req, file, callback) {
//     checkFileType(file, callback);
//   },
// }).single("myImage");

// // Initialize upload variable for uploading group images
// const uploadGroupImage = multer({
//   storage: groupImageStorage,
//   fileFilter: function (req, file, callback) {
//     checkFileType(file, callback);
//   },
// }).single("myImage");

// app.set("uploadProfileImage", uploadProfileImage);
// app.set("uploadGroupImage", uploadGroupImage);

// routes
app.use("/users", user);
app.use("/masters", master);
app.use("/search", search);
app.use("/groups", group);

//starting the server
app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
