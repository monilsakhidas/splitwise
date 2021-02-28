"use strict";

module.exports = (Sequelize, db) => {
  const Expense = db.define("expense", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    description: {
      type: Sequelize.STRING(256),
      allowNull: false,
      notEmpty: true,
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
    // userID to whom the money was paid when the expense is of type settle up.
    // Else the value should be 0
    transactionTypeId: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
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
  return Expense;
};
