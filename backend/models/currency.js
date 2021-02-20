"use strict";
const Sequelize = require("sequelize");
const db = require("../database_scripts/database");

module.exports = (Sequelize, db) => {
  const Currency = db.define("currency", {
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

    symbol: {
      type: Sequelize.STRING(1),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
  });
  return Currency;
};
