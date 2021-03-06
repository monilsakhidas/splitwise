"use strict";

module.exports = (Sequelize, db) => {
  const Activity = db.define("activity", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    groupBalance: {
      type: Sequelize.DOUBLE,
      allowNull: false,
    },
    totalBalance: {
      type: Sequelize.DOUBLE,
      allowNull: false,
    },
    expenseBalance: {
      type: Sequelize.DOUBLE,
      allowNull: false,
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
  return Activity;
};
