"use strict";

// imports
const numeral = require("numeral");
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
  updateOrCreate: async (model, where, newItem) => {
    const foundItem = await model.findOne({ where });
    if (!foundItem) {
      // Item not found, create a new one
      const item = await model.create(newItem);
      return { item, created: true };
    }
    // Found an item, update it
    const item = await model.update(newItem, { where });
    return { item, created: false };
  },
  getGroupBalanceStatement: (amount, currencySymbol) => {
    if (amount < 0)
      return "owes " + currencySymbol + numeral(-1 * amount).format("0.[00]");
    else if (amount > 0)
      return "gets back " + currencySymbol + numeral(amount).format("0.[00]");
    else return null;
  },
  getPersonalOwesYouBalanceStatement: (
    userName,
    currencySymbol,
    groupName,
    amount
  ) => {
    return (
      userName +
      " owes you " +
      currencySymbol +
      numeral(amount).format("0.[00]") +
      " for " +
      groupName +
      "."
    );
  },
  getPersonalOwingBalanceStatement: (
    userName,
    currencySymbol,
    groupName,
    amount
  ) => {
    return (
      "You owe " +
      userName +
      " " +
      currencySymbol +
      numeral(amount).format("0.[00]") +
      " for " +
      groupName +
      "."
    );
  },
};
