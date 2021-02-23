"use strict";

// imports
const express = require("express");
const jwt = require("jsonwebtoken");
const utils = require("../helpers/utils");
const models = require("../models/model_relations");
const router = express.Router();

router.get(
  "/currencies",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    models.currencies.findAll().then((currencyList) => {
      res.status(200).send({ currencyList });
    });
  }
);

module.exports = router;
