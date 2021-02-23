"use strict";

module.exports = (Sequelize, db) => {
  const Debt = db.define("debt", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    amount: {
      type: Sequelize.DOUBLE,
      allowNull: false,
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
  return Debt;
};
