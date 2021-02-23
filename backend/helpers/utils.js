"use strict";

// imports
const jwt = require("jsonwebtoken");
const config = require("../configuration/config");

module.exports = {
  checkIfTokenExists: (req, res, next) => {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== "undefined") {
      const bearerHeaderParts = bearerHeader.split(" ");
      if (bearerHeaderParts.length == 2) {
        req.token = bearerHeaderParts[1];
        next();
        return;
      }
    }
    res.status(401).send({
      errorMessage: "Please login to continue",
    });
    return;
  },
  verifyToken: (req, res, next) => {
    try {
      req.user = jwt.verify(req.token, config.jwt.secretKey);
      next();
      return;
    } catch (err) {
      res.status(401).send({
        errorMessage: "Please login to continue",
      });
      return;
    }
  },
  status: {
    inviteAccepted: "INVITE_ACCEPTED",
    inviteRejected: "INVITE_REJECTED",
    inviteSent: "INVITE_SENT",
    leftGroup: "LEFT_GROUP",
  },
};
