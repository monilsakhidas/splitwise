"use strict";

// imports
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const user = require("./users/routes");
const master = require("./masters/routes");
const search = require("./search/routes");
const group = require("./groups/routes");

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
app.use("/masters", master);
app.use("/search", search);
app.use("/groups", group);

//starting the server
app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
