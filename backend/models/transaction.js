"use strict";

module.exports = (Sequelize, db) => {
  const Transaction = db.define("transaction", {
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

    description: {
      type: Sequelize.STRING(256),
      allowNull: false,
      notEmpty: true,
    },
  });
  return Transaction;
};
