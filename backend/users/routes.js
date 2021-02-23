"use strict";

// imports
const express = require("express");
const bcrypt = require("bcrypt");
const models = require("../models/model_relations");
const config = require("../configuration/config");
const utils = require("../helpers/utils");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
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
module.exports = router;
