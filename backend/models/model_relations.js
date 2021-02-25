"use strict";

const Sequelize = require("sequelize");
const db = require("../database_scripts/database");

const models = {};
// Importing all the models
models.currencies = require("./currency")(Sequelize, db);
models.users = require("./user")(Sequelize, db);
models.groups = require("./group")(Sequelize, db);
//models.transactions = require("./transaction")(Sequelize, db);
models.members = require("./member")(Sequelize, db);
models.expenses = require("./expense")(Sequelize, db);
models.groupBalances = require("./groupBalance")(Sequelize, db);
models.debts = require("./debt")(Sequelize, db);
models.activities = require("./activity")(Sequelize, db);

// Defining all the relations

// User currency fk
models.users.belongsTo(models.currencies, {
  foreignKey: { name: "currencyId", defaultValue: 1 },
});

// Group user fk
models.groups.belongsTo(models.users, { foreignKey: "createdBy" });

// // Transaction group fk
// models.transactions.belongsTo(models.groups, { foreignKey: "groupId" });
// // Transaction user (lender) fk
// models.transactions.belongsTo(models.users, { foreignKey: "lenderId" });
// // Transaction user (lendee) fk
// models.transactions.belongsTo(models.users, { foreignKey: "lendeeId" });
// // Transaction currency fk
// models.transactions.belongsTo(models.currencies, { foreignKey: "currencyId" });
// // Transaction user (createdBy) fk
// models.transactions.belongsTo(models.users, { foreignKey: "createdBy" });

// Member group fk
models.members.belongsTo(models.groups, { foreignKey: "groupId" });
// Member user fk
models.members.belongsTo(models.users, { foreignKey: "userId" });

// Expense group fk
models.expenses.belongsTo(models.groups, { foreignKey: "groupId" });
// Expense users (user which pays the expense) fk
models.expenses.belongsTo(models.users, { foreignKey: "paidByUserId" });
// Expense currency fk
models.expenses.belongsTo(models.currencies, { foreignKey: "currencyId" });

// GroupBalance group fk
models.groupBalances.belongsTo(models.groups, { foreignKey: "groupId" });
// GroupBalance user fk
models.groupBalances.belongsTo(models.users, { foreignKey: "userId" });
// GroupBalance currency fk
models.groupBalances.belongsTo(models.currencies, { foreignKey: "currencyId" });

// Debt currency fk
models.debts.belongsTo(models.currencies, { foreignKey: "currencyId" });
// Debt paid by(amount) user fk (User with smaller ID)
models.debts.belongsTo(models.users, { foreignKey: "userId1" });
// Debt paid to(amount) user fk (User with bigger ID)
models.debts.belongsTo(models.users, { foreignKey: "userId2" });
// Debt recored in a group fk
models.debts.belongsTo(models.groups, { foreignKey: "groupId" });

// Activity expense fk
models.activities.belongsTo(models.expenses, { foreignKey: "expenseId" });
// Activity user fk
models.activities.belongsTo(models.users, { foreignKey: "userId" });
// GroupBalance currency fk
models.activities.belongsTo(models.currencies, { foreignKey: "currencyId" });

module.exports = models;
