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
const multer = require("multer");
const path = require("path");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc"); // dependent on utc plugin
const timezone = require("dayjs/plugin/timezone");
const localizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

// Initializing Router
const router = express.Router();

// Initializing storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/profile/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
        "_" +
        req.user.id +
        "_" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

// Check file tyopes function
// const checkFileType = (file, callback) => {
//   const fileTypes = /jpeg|hpg|png|gif/;
//   const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = fileTypes.test(file.mimetype);
//   if (extname && mimetype) {
//     return callback(null, true);
//   } else {
//     return callback("Images Only!", false);
//   }
// };

// Middleware to upload images where the image size should be less than 5MB
const uploadProfileImage = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

// signup route
router.post("/signup", async (req, res) => {
  // Creating schema for validating input
  const schema = Joi.object({
    name: Joi.string()
      .required()
      .max(64)
      .regex(/^[a-zA-Z ]*$/)
      .messages({
        "any.required": "Enter a valid name.",
        "string.empty": "Enter a valid name.",
        "string.pattern.base": "Enter a valid name",
        "string.max": "Length of the name should not exceed 64 characters",
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
  console.log(bearerHeader);
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
        image: user.image,
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
  uploadProfileImage.single("profileImage"),
  async (req, res) => {
    console.log("Inside");
    // Creating a schema for validatio of input fields
    const schema = Joi.object({
      email: Joi.string()
        .email({
          minDomainSegments: 2,
          tlds: { allow: ["com", "net"] },
        })
        .required()
        .messages({
          "string.email": "Enter a valid email.",
          "string.empty": "Enter a valid email.",
          "any.required": "Email is required.",
        }),
      name: Joi.string()
        .required()
        .max(64)
        .regex(/^[a-zA-Z ]*$/)
        .messages({
          "any.required": "Enter a valid name.",
          "string.empty": "Enter a valid name.",
          "string.pattern.base": "Enter a valid name",
          "string.max": "Length of the name should not exceed 64 characters",
        }),
      timezone: Joi.string().min(1).max(64).required().messages({
        "any.required": "Enter a valid timezone",
        "string.empty": "Enter a valid timezone",
      }),
      language: Joi.string().min(1).max(64).required().messages({
        "any.required": "Enter a valid language",
        "string.empty": "Enter a valid language",
      }),
      currencyId: Joi.number().positive().integer().required().messages({
        "any.required": "Enter a valid currency",
        "number.positive": "Enter a valid number",
        "number.integer": "Enter a valid currency",
      }),
      number: Joi.string().min(10).max(10).messages({
        "string.max": "Enter a valid number",
        "string.min": "Enter a valid number",
      }),
    });
    // Validate the input fields
    console.log(req.body);
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    console.log("Inside2");
    // find Image path of the updated Image
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.path.substring(req.file.path.indexOf("/") + 1);
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
            image: imagePath,
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
            console.log(err.name);
            if (err.name === config.errors.uniqueErrorName) {
              res.status(400).send({
                errorMessage:
                  "This email is already used. Please use another email",
              });
            } else if (err.name === config.errors.validationErrorName) {
              res.status(400).send({
                errorMessage: "Enter a valid number",
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

// Calculating the debts
router.get(
  "/debts",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const youAreOwed = {};
    const youOwe = {};

    // if (req.query.id) {
    //   const schema = Joi.number().required().positive().integer().messages({
    //     "any.required": "Select a valid group",
    //     "number.positive": "Select a valid group",
    //     "number.base": "Select a valid group",
    //     "number.integer": "Select a valid group",
    //   });
    //   // Validate schema
    //   const result = await schema.validate(req.query.id);
    //   if (result.error) {
    //     res.status(400).send({ errorMessage: result.error.details[0].message });
    //     return;
    //   }
    //   const groupMembership = await models.members.findOne({
    //     where: {
    //       userId: req.user.id,
    //       status: utils.status.inviteAccepted,
    //       groupId: req.query.id,
    //     },
    //   });
    //   if (!groupMembership) {
    //     // Group does not exist
    //     res.status(400).send({ errorMessage: "Select a valid group." });
    //     return;
    //   }
    // }

    let rawDebts1 = await models.debts.findAll({
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
          attributes: ["id", "name", "image"],
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

    let rawDebts2 = await models.debts.findAll({
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
          attributes: ["id", "name", "image"],
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

    // // If groupId is given
    // if (req.query.id) {
    //   rawDebts1 = rawDebts1.filter(
    //     (rawDebt) => rawDebt.group.id == req.query.id
    //   );
    //   rawDebts2 = rawDebts2.filter(
    //     (rawDebt) => rawDebt.group.id == req.query.id
    //   );
    // }

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
      if (!youAreOwed[userId]["image"])
        youAreOwed[userId]["image"] =
          debtsGroupedByUserId1[userId][0]["user"]["image"];

      if (!youOwe[userId]) youOwe[userId] = {};
      if (!youOwe[userId]["statements"]) youOwe[userId]["statements"] = [];
      if (!youOwe[userId]["amount"]) youOwe[userId]["amount"] = {};
      if (!youOwe[userId]["name"])
        youOwe[userId]["name"] =
          debtsGroupedByUserId1[userId][0]["user"]["name"];
      if (!youOwe[userId]["image"])
        youOwe[userId]["image"] =
          debtsGroupedByUserId1[userId][0]["user"]["image"];

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
            youAreOwed[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol,
              positiveAmount
            );
          } else {
            youAreOwed[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              youAreOwed[userId]["amount"][currencyId][0],
              Number(
                youAreOwed[userId]["amount"][currencyId].slice(
                  1,
                  youAreOwed[userId]["amount"][currencyId].length
                )
              ) + positiveAmount
            );
          }
        }
        if (
          negativeAmount > 0 &&
          debtsGroupedByUserIdByCurrencyId[currencyId].length != 0
        ) {
          if (!youOwe[userId]["amount"][currencyId]) {
            youOwe[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol,
              negativeAmount
            );
          } else {
            youOwe[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              youOwe[userId]["amount"][currencyId][0],
              Number(
                youOwe[userId]["amount"][currencyId].slice(
                  1,
                  youOwe[userId]["amount"][currencyId].length
                )
              ) + negativeAmount
            );
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
      if (!youAreOwed[userId]["image"])
        youAreOwed[userId]["image"] =
          debtsGroupedByUserId2[userId][0]["user"]["image"];
      if (!youOwe[userId]) youOwe[userId] = {};
      if (!youOwe[userId]["statements"]) youOwe[userId]["statements"] = [];
      if (!youOwe[userId]["amount"]) youOwe[userId]["amount"] = {};
      if (!youOwe[userId]["name"])
        youOwe[userId]["name"] =
          debtsGroupedByUserId2[userId][0]["user"]["name"];
      if (!youOwe[userId]["image"])
        youOwe[userId]["image"] =
          debtsGroupedByUserId2[userId][0]["user"]["image"];

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
            youAreOwed[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol,
              positiveAmount
            );
          } else {
            youAreOwed[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              youAreOwed[userId]["amount"][currencyId][0],
              Number(
                youAreOwed[userId]["amount"][currencyId].slice(
                  1,
                  youAreOwed[userId]["amount"][currencyId].length
                )
              ) + positiveAmount
            );
          }
        }
        if (
          negativeAmount > 0 &&
          debtsGroupedByUserIdByCurrencyId[currencyId].length != 0
        ) {
          if (!youOwe[userId]["amount"][currencyId]) {
            youOwe[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              debtsGroupedByUserIdByCurrencyId[currencyId][0].currency.symbol,
              negativeAmount
            );
          } else {
            youOwe[userId]["amount"][
              currencyId
            ] = utils.getFormattedAmountWithCurrency(
              youOwe[userId]["amount"][currencyId][0],
              Number(
                youOwe[userId]["amount"][currencyId].slice(
                  1,
                  youOwe[userId]["amount"][currencyId].length
                )
              ) + negativeAmount
            );
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

// Settle up API
router.post(
  "/settle",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // Construct a schema
    const schema = Joi.object({
      id: Joi.number().positive().integer().required().messages({
        "any.required": "Select a user to settle the balance.",
        "number.base": "Select a valid user.",
        "number.positive": "Select a valid user.",
        "number.integer": "Select a valid user.",
      }),
    });
    // Validate the input data
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    // userId1 is the smaller userId
    // userId2 is the larger userId
    const [userId1, userId2] =
      req.user.id < req.body.id
        ? [req.user.id, req.body.id]
        : [req.body.id, req.user.id];

    // Check if the user has any association in any group with the selected user
    const rawUserDebts = await models.debts.findAll({
      where: {
        userId1,
        userId2,
        amount: {
          [Op.ne]: 0,
        },
      },
    });

    // If rawUserDebts is empty than return with bad request
    // as there is no asscoiation between the two users
    if (rawUserDebts.length == 0) {
      res.status(400).send({
        errorMessage:
          "Select a valid user with whom the accounts are not settled.",
      });
      return;
    }

    // How much debt is there between these 2 users
    // in every group and in every currency
    const transaction = await db.transaction();
    try {
      await rawUserDebts.forEach(async (rawDebt, index) => {
        await utils.settleUpTheUsers(rawDebt, transaction);
        if (index == rawUserDebts.length - 1) {
          await transaction.commit();
          res.status(200).send({
            message: "Successfully settled up",
          });
          return;
        }
      }, transaction);
    } catch (error) {
      await transaction.rollback();
      res.status(400).send({ errorMessage: error });
      return;
    }
  }
);

// get Users list for settleUp API
router.get(
  "/settle",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const userSet = new Set();
    const rawUserDebts = await models.debts.findAll({
      where: {
        amount: {
          [Op.ne]: 0,
        },
        [Op.or]: [
          {
            userId1: req.user.id,
          },
          {
            userId2: req.user.id,
          },
        ],
      },
    });
    await rawUserDebts.forEach(async (rawDebt, index) => {
      userSet.add(rawDebt.userId1);
      userSet.add(rawDebt.userId2);
    });
    userSet.delete(req.user.id);
    const userList = Array.from(userSet);
    const users = await models.users.findAll({
      where: {
        id: userList,
      },
      attributes: ["id", "name", "email"],
    });
    res.status(200).send({ users });
  }
);

// Get Recent Activity
router.get(
  "/activity",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // Construct schema
    const schema = Joi.object({
      // 1 -> DESC, 2 -> ASC
      orderBy: Joi.number().integer().min(1).max(2).messages({
        "number.integer": "Select a valid sorting category",
        "number.min": "Select a valid sorting category",
        "number.max": "Select a valid sorting category",
        "number.base": "Select a valid sorting category",
      }),
      // 0 groupId means across all groups
      groupId: Joi.number().integer().min(1).messages({
        "number.base": "Select a valid group",
        "number.integer": "Select a valid group",
        "number.min": "Select a valid group",
      }),
    });
    // Validating schema for the input fields
    const result = await schema.validate(req.query);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    // Get all activities across all groups ordered by most recent first
    let recentActivities = await models.activities.findAll({
      where: {
        userId: req.user.id,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: models.expenses,
          attributes: [
            "id",
            "description",
            "amount",
            "paidByUserId",
            "currencyId",
            "transactionTypeId",
          ],
          required: true,
          include: [
            {
              model: models.users,
              attributes: ["id", "name", "image"],
              required: true,
            },
            {
              model: models.currencies,
              attributes: ["id", "symbol", "name"],
              required: true,
            },
            {
              model: models.groups,
              attributes: ["id", "name"],
              required: true,
            },
          ],
        },
        {
          model: models.users,
          attributes: ["timezone"],
          required: true,
        },
      ],
    });
    // If recent activities is empty
    if (recentActivities.length == 0) {
      res
        .status(200)
        .send({ message: "No recent activity", recentActivities: [] });
      return;
    }
    // Reverse list if ordering category i spresent
    if (req.query.orderBy != null && req.query.orderBy == 2) {
      recentActivities.reverse();
    }

    // Filter by groupId if GroupId is presen in uery params
    if (req.query.groupId != null) {
      recentActivities = recentActivities.filter(
        (recentActivity) => req.query.groupId == recentActivity.expense.group.id
      );
      if (recentActivities.length == 0) {
        res.status(200).send({ message: "No recent group activity" });
        return;
      }
    }

    const recentActivitiesResponse = [];
    for (let index = 0; index < recentActivities.length; index++) {
      await recentActivitiesResponse.push({
        description: await utils.recentActivityDescriptionStatement(
          recentActivities[index],
          req.user.id
        ),
        balanceStatement: utils.recentActivityBalanceStatement(
          recentActivities[index],
          req.query.groupId != null
        ),
        expenseStatement: utils.recentActivityExpenseStatement(
          recentActivities[index]
        ),
        time: dayjs
          .tz(
            recentActivities[index].createdAt,
            recentActivities[index].user.timezone
          )
          .format("lll"),
        image: recentActivities[index].expense.user.image,
      });
    }
    res.status(200).send({ recentActivities: recentActivitiesResponse });
  }
);

// Get logged in user's currency
router.get(
  "/currency",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const user = await models.users.findOne({
      where: {
        id: req.user.id,
      },
      attributes: ["id", "currencyId"],
      include: [
        {
          model: models.currencies,
          attributes: ["id", "symbol"],
        },
      ],
    });
    res.status(200).send({
      id: user.currency.id,
      symbol: user.currency.symbol,
    });
  }
);

// Get all balances for dashboard
router.get(
  "/balance",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const rawUserDebts = await models.debts.findAll({
      where: {
        amount: {
          [Op.ne]: 0,
        },
        [Op.or]: [
          {
            userId1: req.user.id,
          },
          {
            userId2: req.user.id,
          },
        ],
      },
      include: [
        {
          model: models.currencies,
          attributes: ["id", "symbol"],
        },
      ],
    });

    const youGetAmount = {};
    const youOweAmount = {};
    const totalAmount = {};
    await rawUserDebts.forEach((rawDebt) => {
      if (rawDebt.userId1 == req.user.id) {
        // You have to pay
        if (rawDebt.amount < 0) {
          // If entry exists
          if (youOweAmount[rawDebt.currency.id]) {
            youOweAmount[rawDebt.currency.id]["amount"] =
              youOweAmount[rawDebt.currency.id]["amount"] - rawDebt.amount;
            totalAmount[rawDebt.currency.id]["amount"] =
              totalAmount[rawDebt.currency.id]["amount"] + rawDebt.amount;
          }
          // If entry does not exist
          else {
            // Check If total amount does not exist for this currency
            if (totalAmount[rawDebt.currency.id]) {
              totalAmount[rawDebt.currency.id]["amount"] =
                totalAmount[rawDebt.currency.id]["amount"] + rawDebt.amount;
            }
            // If total amount entry does not exist
            else {
              totalAmount[rawDebt.currency.id] = {};
              totalAmount[rawDebt.currency.id]["symbol"] =
                rawDebt.currency.symbol;
              totalAmount[rawDebt.currency.id]["amount"] = rawDebt.amount;
            }
            youOweAmount[rawDebt.currency.id] = {};
            youOweAmount[rawDebt.currency.id]["amount"] = -rawDebt.amount;
            youOweAmount[rawDebt.currency.id]["symbol"] =
              rawDebt.currency.symbol;
          }
        }
        // You get
        else if (rawDebt.amount > 0) {
          // If entry exists
          if (youGetAmount[rawDebt.currency.id]) {
            youGetAmount[rawDebt.currency.id]["amount"] =
              youGetAmount[rawDebt.currency.id]["amount"] + rawDebt.amount;
            totalAmount[rawDebt.currency.id]["amount"] =
              totalAmount[rawDebt.currency.id]["amount"] + rawDebt.amount;
          }
          // If entry does not exist
          else {
            youGetAmount[rawDebt.currency.id] = {};
            youGetAmount[rawDebt.currency.id]["amount"] = rawDebt.amount;
            youGetAmount[rawDebt.currency.id]["symbol"] =
              rawDebt.currency.symbol;
            // Check If total amount does not exist for this currency
            if (totalAmount[rawDebt.currency.id]) {
              totalAmount[rawDebt.currency.id]["amount"] =
                totalAmount[rawDebt.currency.id]["amount"] + rawDebt.amount;
            }
            // If total amount entry does not exist
            else {
              totalAmount[rawDebt.currency.id] = {};
              totalAmount[rawDebt.currency.id]["symbol"] =
                rawDebt.currency.symbol;
              totalAmount[rawDebt.currency.id]["amount"] = rawDebt.amount;
            }
          }
        }
      } else if (rawDebt.userId2 == req.user.id) {
        // You get
        if (rawDebt.amount < 0) {
          // If entry exists
          if (youGetAmount[rawDebt.currency.id]) {
            youGetAmount[rawDebt.currency.id]["amount"] =
              youGetAmount[rawDebt.currency.id]["amount"] - rawDebt.amount;
            totalAmount[rawDebt.currency.id]["amount"] =
              totalAmount[rawDebt.currency.id]["amount"] - rawDebt.amount;
          }
          // If entry does not exist
          else {
            youGetAmount[rawDebt.currency.id] = {};
            youGetAmount[rawDebt.currency.id]["amount"] = -rawDebt.amount;
            youGetAmount[rawDebt.currency.id]["symbol"] =
              rawDebt.currency.symbol;
            // Check If total amount does not exist for this currency
            if (totalAmount[rawDebt.currency.id]) {
              totalAmount[rawDebt.currency.id]["amount"] =
                totalAmount[rawDebt.currency.id]["amount"] - rawDebt.amount;
            }
            // If total amount entry does not exist
            else {
              totalAmount[rawDebt.currency.id] = {};
              totalAmount[rawDebt.currency.id]["symbol"] =
                rawDebt.currency.symbol;
              totalAmount[rawDebt.currency.id]["amount"] = -rawDebt.amount;
            }
          }
        }
        // You have to pay
        else if (rawDebt.amount > 0) {
          // If entry exists
          if (youOweAmount[rawDebt.currency.id]) {
            youOweAmount[rawDebt.currency.id]["amount"] =
              youOweAmount[rawDebt.currency.id]["amount"] + rawDebt.amount;
            totalAmount[rawDebt.currency.id]["amount"] =
              totalAmount[rawDebt.currency.id]["amount"] - rawDebt.amount;
          }
          // If entry does not exist
          else {
            youOweAmount[rawDebt.currency.id] = {};
            youOweAmount[rawDebt.currency.id]["amount"] = rawDebt.amount;
            youOweAmount[rawDebt.currency.id]["symbol"] =
              rawDebt.currency.symbol;
            // Check If total amount does not exist for this currency
            if (totalAmount[rawDebt.currency.id]) {
              totalAmount[rawDebt.currency.id]["amount"] =
                totalAmount[rawDebt.currency.id]["amount"] - rawDebt.amount;
            }
            // If total amount entry does not exist
            else {
              totalAmount[rawDebt.currency.id] = {};
              totalAmount[rawDebt.currency.id]["symbol"] =
                rawDebt.currency.symbol;
              totalAmount[rawDebt.currency.id]["amount"] = -rawDebt.amount;
            }
          }
        }
      }
    });
    res.status(200).send({
      owe: utils.getFormattedAmount(
        utils.getAmountWithSymbolFromMap(youOweAmount)
      ),
      get: utils.getFormattedAmount(
        utils.getAmountWithSymbolFromMap(youGetAmount)
      ),
      total: utils.getFormattedAmount(
        utils.getAmountWithSymbolFromMap(totalAmount)
      ),
    });
  }
);

module.exports = router;
