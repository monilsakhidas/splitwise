"use strict";
const Sequelize = require("sequelize");
const db = require("../database_scripts/database");

module.exports = (Sequelize, db) => {
  const Group = db.define("group", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    name: {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },

    image: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },

    groupStrength: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isZeroOrLesser(value) {
          if (value <= 0) {
            throw new Error("Value should be a positive number");
          }
        },
      },
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
  return Group;
};
