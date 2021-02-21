"use strict";
const Sequelize = require("sequelize");
const db = require("../database_scripts/database");

module.exports = (Sequelize, db) => {
  const User = db.define("user", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    name: {
      type: Sequelize.STRING(64),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    email: {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "It should be a valid email address",
        },
      },
    },

    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    number: {
      type: Sequelize.STRING(10),
      allowNull: true,
      validate: {
        len: [10, 10],
        isNumeric: true,
      },
    },

    timezone: {
      type: Sequelize.STRING(64),
      defaultValue: "America/Los_Angeles",
      allowNull: false,
    },

    language: {
      type: Sequelize.STRING(64),
      defaultValue: "en",
      allowNull: false,
    },

    image: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },

    createdAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn("now"),
    },

    updatedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn("now"),
    },
  });
  return User;
};
