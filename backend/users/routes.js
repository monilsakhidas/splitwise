"use strict";

// imports
const express = require("express");
const bcrypt = require("bcrypt");
const models = require("../models/model_relations");
const config = require("../configuration/config");
const utils = require("../helpers/utils");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const db = require("../database_scripts/database");
const _ = require("lodash");
const { Op } = require("sequelize");
const router = express.Router();

// signup route
router.post("/signup", async (req, res) => {
  // Creating schema for validating input
  const schema = Joi.object({
    name: Joi.string().alphanum().min(1).max(64).required().messages({
      "any.required": "Name is required",
      "string.empty": "Name cannot be empty.",
    }),
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net"] },
      })
      .required()
      .messages({
        "string.email": "Must be a valid email.",
        "string.empty": "Email cannot be empty.",
        "any.required": "Email is required.",
      }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required.",
      "any.required": "Password cannot be empty",
    }),
  });

  // Validating schema for the input fields
  const result = await schema.validate(req.body);
  if (result.error) {
    res.status(400).send({ errorMessage: result.error.details[0].message });
    return;
  }

  const name = req.body.name;
  const email = req.body.email.toLowerCase();
  const password = req.body.password;
  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());
  const userObject = { name: name, email: email, password: hashedPassword };

  // Generate entry into users table
  models.users
    .create(userObject, {
      fields: ["name", "email", "password"],
    })
    .then((user) => {
      const unsignedJwtUserObject = {
        id: user.id,
        name: user.name,
        email: user.email,
        currencyId: user.currencyId,
      };
      const jwtToken = jwt.sign(unsignedJwtUserObject, config.jwt.secretKey);
      res.status(200).send({
        user: unsignedJwtUserObject,
        token: jwtToken,
        message: "Signed up successfully.",
      });
    })
    .catch((err) => {
      if (err.name === config.errors.uniqueErrorName) {
        res.status(400).send({
          errorMessage: "Account belonging to this email already exists.",
        });
      } else {
        res.status(400).send({ err });
      }
    });
});

// Login route
router.post("/login", async (req, res) => {
  // Check if already logged in
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearerHeaderParts = bearerHeader.split(" ");
    const bearerToken = bearerHeaderParts[1];
    try {
      const decodedData = jwt.verify(bearerToken, config.jwt.secretKey);
      res.status(200).send({
        user: decodedData,
        token: bearerToken,
        message: "Already logged in.",
      });
      return;
    } catch (err) {
      // do nothing
    }
  }

  // Creating a schema for validating input fields
  const schema = Joi.object({
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net"] },
      })
      .required()
      .messages({
        "string.email": "Must be a valid email.",
        "string.empty": "Email cannot be empty.",
        "any.required": "Email is required.",
      }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required.",
      "any.required": "Password cannot be empty",
    }),
  });
  // Validate the input fields
  const result = await schema.validate(req.body);
  if (result.error) {
    res.status(400).send({ errorMessage: result.error.details[0].message });
    return;
  }
  // Check if the user with the input email exists
  models.users
    .findOne({ where: { email: req.body.email.toLowerCase() } })
    .then(async (user) => {
      if (
        user == null ||
        !(await bcrypt.compare(req.body.password, user.password))
      ) {
        res.status(401).send({ errorMessage: "Invalid email or password" });
      } else {
        const unsignedJwtUserObject = {
          id: user.id,
          name: user.name,
          email: user.email,
          currencyId: user.currencyId,
        };
        // Generate a JWT token
        const jwtToken = jwt.sign(unsignedJwtUserObject, config.jwt.secretKey);
        res.status(200).send({
          user: unsignedJwtUserObject,
          token: jwtToken,
          message: "Logged in successfully.",
        });
      }
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

// Get profile page
router.get(
  "/profile",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    models.users.findOne({ where: { id: req.user.id } }).then(async (user) => {
      const currency = await models.currencies.findOne({
        where: { id: user.currencyId },
      });
      res.status(200).send({
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        language: user.language,
        number: user.number,
        currency: {
          id: currency.id,
          name: currency.name,
          symbol: currency.symbol,
        },
      });
    });
  }
);

// put profile page
router.put(
  "/profile",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // Creating a schema for validatio of input fields
    const schema = Joi.object({
      email: Joi.string()
        .email({
          minDomainSegments: 2,
          tlds: { allow: ["com", "net"] },
        })
        .required()
        .messages({
          "string.email": "Must be a valid email.",
          "string.empty": "Email cannot be empty.",
          "any.required": "Email is required.",
        }),
      name: Joi.string().alphanum().min(1).max(64).required().messages({
        "any.required": "Name is required",
        "string.empty": "Name cannot be empty.",
      }),
      timezone: Joi.string().min(1).max(64).required().messages({
        "any.required": "Enter a timezone",
      }),
      language: Joi.string().min(1).max(64).required().messages({
        "any.required": "Enter a language",
      }),
      currencyId: Joi.number().positive().integer().required().messages({
        "any.required": "Enter a valid currency",
      }),
      number: Joi.string().min(10).max(10).messages({
        "string.max": "Enter a valid number",
        "string.min": "Enter a valid number",
      }),
    });
    // Validate the input fields
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    // Update user profile
    models.users
      .findOne({ where: { id: req.user.id } })
      .then((user) =>
        user
          .update({
            language: req.body.language,
            email: req.body.email.toLowerCase(),
            number: req.body.number,
            timezone: req.body.timezone,
            currencyId: req.body.currencyId,
          })
          .then(async (updatedUser) => {
            const currency = await models.currencies.findOne({
              where: { id: updatedUser.currencyId },
            });
            res.status(200).send({
              language: updatedUser.language,
              email: updatedUser.email.toLowerCase(),
              number: updatedUser.number,
              timezone: updatedUser.timezone,
              currency: {
                id: currency.id,
                symbol: currency.symbol,
                name: currency.name,
              },
            });
          })
          .catch((err) => {
            if (err.name === config.errors.uniqueErrorName) {
              res.status(400).send({
                errorMessage:
                  "This email is already used. Please use another email",
              });
            } else if (err.name === config.errors.foreignKeyError) {
              res.status(400).send({
                errorMessage: "Enter a valid currency",
              });
            } else {
              res.status(400).send(err);
            }
          })
      )
      .catch((err) => res.status(400).send(err));
  }
);

router.get(
  "/totalbalance",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const rawTotalBalances = await models.groupBalances.findAll({
      attributes: [
        "userId",
        "groupId",
        "currencyId",
        [db.fn("sum", db.col("balance")), "finalBalance"],
      ],
      where: {
        userId: req.user.id,
      },
      group: ["userId", "groupId", "currencyId"],
      include: [
        {
          model: models.currencies,
          required: true,
          attributes: ["id", "symbol"],
        },
      ],
    });
    const totalBalances = await rawTotalBalances
      .filter((rawTotalBalance) => rawTotalBalance.finalBalance != 0)
      .map((rawTotalBalance) => {
        return {
          balance: rawTotalBalance.dataValues.finalBalance,
          symbol: rawTotalBalance.currency.symbol,
        };
      });
    res.status(200).send({ totalBalances });
  }
);

router.get(
  "/debts",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const youAreOwed = {};
    const youOwe = {};

    const rawDebts1 = await models.debts.findAll({
      where: {
        userId1: req.user.id,
        amount: {
          [Op.ne]: 0,
        },
      },
      include: [
        {
          model: models.currencies,
          required: true,
          attributes: ["id", "symbol"],
        },
        {
          model: models.users,
          required: true,
          attributes: ["id", "name"],
          on: {
            col1: db.where(db.col("user.id"), "=", db.col("userId2")),
          },
        },
        {
          model: models.groups,
          required: true,
          attributes: ["id", "name"],
        },
      ],
    });

    const rawDebts2 = await models.debts.findAll({
      where: {
        userId2: req.user.id,
        amount: {
          [Op.ne]: 0,
        },
      },
      include: [
        {
          model: models.currencies,
          required: true,
          attributes: ["id", "symbol"],
        },
        {
          model: models.users,
          required: true,
          attributes: ["id", "name"],
          on: {
            col1: db.where(db.col("user.id"), "=", db.col("userId1")),
          },
        },
        {
          model: models.groups,
          required: true,
          attributes: ["id", "name"],
        },
      ],
    });

    // Calculation for Raw debts 1 ------------------------------------------------------

    // Group by userId
    const debtsGroupedByUserId1 = _.chain(rawDebts1)
      .groupBy((rawDebt) => {
        return rawDebt.userId2;
      })
      .value();

    for (let userId in debtsGroupedByUserId1) {
      const debtsGroupedByUserIdByCurrencyId = _.chain(
        debtsGroupedByUserId1[userId]
      )
        .groupBy((debtGroupedByUserId) => {
          return debtGroupedByUserId.currencyId;
        })
        .value();

      // Initializing the entry for each user
      if (!youAreOwed[userId]) youAreOwed[userId] = {};
      if (!youAreOwed[userId]["statements"])
        youAreOwed[userId]["statements"] = [];
      if (!youAreOwed[userId]["amount"]) youAreOwed[userId]["amount"] = {};
      if (!youAreOwed[userId]["name"])
        youAreOwed[userId]["name"] =
          debtsGroupedByUserId1[userId][0]["user"]["name"];

      if (!youOwe[userId]) youOwe[userId] = {};
      if (!youOwe[userId]["statements"]) youOwe[userId]["statements"] = [];
      if (!youOwe[userId]["amount"]) youOwe[userId]["amount"] = {};
      if (!youOwe[userId]["name"])
        youOwe[userId]["name"] =
          debtsGroupedByUserId1[userId][0]["user"]["name"];

      // Iterating through currencies

      for (let currencyId in debtsGroupedByUserIdByCurrencyId) {
        // Money lent to others
        let positiveAmount = 0;

        // Money lent from others
        let negativeAmount = 0;

        for (
          let index = 0;
          index < debtsGroupedByUserIdByCurrencyId[currencyId].length;
          index++
        ) {
          // Money lent to others
          if (debtsGroupedByUserIdByCurrencyId[currencyId][index].amount > 0) {
            youAreOwed[userId]["statements"].push(
              utils.getPersonalOwesYouBalanceStatement(
                debtsGroupedByUserIdByCurrencyId[currencyId][index].user.name,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].currency
                  .symbol,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].group.name,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].amount
              )
            );
            positiveAmount =
              positiveAmount +
              debtsGroupedByUserIdByCurrencyId[currencyId][index].amount;
          }
          // Money lent from others
          else {
            youOwe[userId]["statements"].push(
              utils.getPersonalOwingBalanceStatement(
                debtsGroupedByUserIdByCurrencyId[currencyId][index].user.name,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].currency
                  .symbol,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].group.name,
                -1 * debtsGroupedByUserIdByCurrencyId[currencyId][index].amount
              )
            );
            negativeAmount =
              negativeAmount +
              -1 * debtsGroupedByUserIdByCurrencyId[currencyId][index].amount;
          }
        }
        if (
          positiveAmount > 0 &&
          debtsGroupedByUserIdByCurrencyId[currencyId].length != 0
        ) {
          if (!youAreOwed[userId]["amount"][currencyId]) {
            youAreOwed[userId]["amount"][currencyId] =
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol +
              positiveAmount;
          } else {
            youAreOwed[userId]["amount"][currencyId] =
              youAreOwed[userId]["amount"][currencyId][0] +
              (Number(
                youAreOwed[userId]["amount"][currencyId].slice(
                  1,
                  youAreOwed[userId]["amount"][currencyId].length
                )
              ) +
                positiveAmount);
          }
        }
        if (
          negativeAmount > 0 &&
          debtsGroupedByUserIdByCurrencyId[currencyId].length != 0
        ) {
          if (!youOwe[userId]["amount"][currencyId]) {
            youOwe[userId]["amount"][currencyId] =
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol +
              negativeAmount;
          } else {
            youOwe[userId]["amount"][currencyId] =
              youOwe[userId]["amount"][currencyId][0] +
              (Number(
                youOwe[userId]["amount"][currencyId].slice(
                  1,
                  youOwe[userId]["amount"][currencyId].length
                )
              ) +
                negativeAmount);
          }
        }
      }

      // delete unnecessary entries
      if (youAreOwed[userId]["statements"].length == 0) {
        delete youAreOwed[userId];
      }
      if (youOwe[userId]["statements"].length == 0) {
        delete youOwe[userId];
      }
    }
    // Calculation for Raw debts 2 ------------------------------------------------------

    // Group by userId
    const debtsGroupedByUserId2 = _.chain(rawDebts2)
      .groupBy((rawDebt) => {
        return rawDebt.userId1;
      })
      .value();

    for (let userId in debtsGroupedByUserId2) {
      const debtsGroupedByUserIdByCurrencyId = _.chain(
        debtsGroupedByUserId2[userId]
      )
        .groupBy((debtGroupedByUserId) => {
          return debtGroupedByUserId.currencyId;
        })
        .value();

      // Initializing the entry for each user
      if (!youAreOwed[userId]) youAreOwed[userId] = {};
      if (!youAreOwed[userId]["statements"])
        youAreOwed[userId]["statements"] = [];
      if (!youAreOwed[userId]["amount"]) youAreOwed[userId]["amount"] = {};
      if (!youAreOwed[userId]["name"])
        youAreOwed[userId]["name"] =
          debtsGroupedByUserId2[userId][0]["user"]["name"];
      if (!youOwe[userId]) youOwe[userId] = {};
      if (!youOwe[userId]["statements"]) youOwe[userId]["statements"] = [];
      if (!youOwe[userId]["amount"]) youOwe[userId]["amount"] = {};
      if (!youOwe[userId]["name"])
        youOwe[userId]["name"] =
          debtsGroupedByUserId2[userId][0]["user"]["name"];

      // Iterating through currencies
      for (let currencyId in debtsGroupedByUserIdByCurrencyId) {
        // Money lent to others
        let positiveAmount = 0;

        // Money lent from others
        let negativeAmount = 0;

        for (
          let index = 0;
          index < debtsGroupedByUserIdByCurrencyId[currencyId].length;
          index++
        ) {
          // Money lent to others
          if (debtsGroupedByUserIdByCurrencyId[currencyId][index].amount < 0) {
            youAreOwed[userId]["statements"].push(
              utils.getPersonalOwesYouBalanceStatement(
                debtsGroupedByUserIdByCurrencyId[currencyId][index].user.name,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].currency
                  .symbol,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].group.name,
                -1 * debtsGroupedByUserIdByCurrencyId[currencyId][index].amount
              )
            );
            positiveAmount =
              positiveAmount +
              -1 * debtsGroupedByUserIdByCurrencyId[currencyId][index].amount;
          }
          // Money lent from others
          else {
            youOwe[userId]["statements"].push(
              utils.getPersonalOwingBalanceStatement(
                debtsGroupedByUserIdByCurrencyId[currencyId][index].user.name,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].currency
                  .symbol,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].group.name,
                debtsGroupedByUserIdByCurrencyId[currencyId][index].amount
              )
            );
            negativeAmount =
              negativeAmount +
              debtsGroupedByUserIdByCurrencyId[currencyId][index].amount;
          }
        }
        if (
          positiveAmount > 0 &&
          debtsGroupedByUserIdByCurrencyId[currencyId].length != 0
        ) {
          if (!youAreOwed[userId]["amount"][currencyId]) {
            youAreOwed[userId]["amount"][currencyId] =
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol +
              positiveAmount;
          } else {
            youAreOwed[userId]["amount"][currencyId] =
              youAreOwed[userId]["amount"][currencyId][0] +
              (Number(
                youAreOwed[userId]["amount"][currencyId].slice(
                  1,
                  youAreOwed[userId]["amount"][currencyId].length
                )
              ) +
                positiveAmount);
          }
        }
        if (
          negativeAmount > 0 &&
          debtsGroupedByUserIdByCurrencyId[currencyId].length != 0
        ) {
          if (!youOwe[userId]["amount"][currencyId]) {
            youOwe[userId]["amount"][currencyId] =
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol +
              negativeAmount;
          } else {
            youOwe[userId]["amount"][currencyId] =
              youOwe[userId]["amount"][currencyId][0] +
              (Number(
                youOwe[userId]["amount"][currencyId].slice(
                  1,
                  youOwe[userId]["amount"][currencyId].length
                )
              ) +
                negativeAmount);
          }
        }
      }

      // Add name of the user
      // youAreOwed[userId]["name"] =

      // delete unnecessary entries
      if (youAreOwed[userId]["statements"].length == 0) {
        delete youAreOwed[userId];
      }
      if (youOwe[userId]["statements"].length == 0) {
        delete youOwe[userId];
      }
    }
    res.status(200).send({ youAreOwed, youOwe });
  }
);
module.exports = router;
