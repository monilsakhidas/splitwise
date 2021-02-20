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
      validate: {
        notEmpty: true,
      },
    },

    image: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });
  return Group;
};
