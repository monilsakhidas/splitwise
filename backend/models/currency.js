"use strict";

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
      type: Sequelize.STRING(4),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
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
  return Currency;
};
