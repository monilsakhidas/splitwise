"use strict";
const Sequelize = require("sequelize");
const db = require("../database_scripts/database");

module.exports = (Sequelize, db) => {
  const Member = db.define("member", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    status: {
      type: Sequelize.ENUM(
        "INVITE_SENT",
        "INVITE_REJECTED",
        "INVITE_ACCEPTED",
        "LEFT_GROUP"
      ),
      allowNull: false,
      notEmpty: true,
    },
  });
  return Member;
};
