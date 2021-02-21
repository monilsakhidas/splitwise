"use strict";

// imports
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const user = require("./users/routes");

// port number
const PORT = 3000;

// app
const app = express();

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));

// routes
app.use("/users", user);

//starting the server
app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
