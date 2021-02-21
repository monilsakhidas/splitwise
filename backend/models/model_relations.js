"use strict";

const Sequelize = require("sequelize");
const db = require("../database_scripts/database");

const models = {};
// Importing all the models
models.currencies = require("./currency")(Sequelize, db);
models.users = require("./user")(Sequelize, db);
models.groups = require("./group")(Sequelize, db);
models.transactions = require("./transaction")(Sequelize, db);
models.members = require("./member")(Sequelize, db);

//defining all the relations

// User currency fk
models.users.belongsTo(models.currencies, {
  foreignKey: { name: "currencyId", defaultValue: 1 },
});

// Group user fk
models.groups.belongsTo(models.users, { foreignKey: "createdBy" });

// Transaction group fk
models.transactions.belongsTo(models.groups, { foreignKey: "groupId" });
// Transaction user (lender) fk
models.transactions.belongsTo(models.users, { foreignKey: "lenderId" });
// Transaction user (lendee) fk
models.transactions.belongsTo(models.users, { foreignKey: "lendeeId" });
// Transaction currency fk
models.transactions.belongsTo(models.currencies, { foreignKey: "currencyId" });
// Transaction user (createdBy) fk
models.transactions.belongsTo(models.users, { foreignKey: "createdBy" });

// Member group fk
models.members.belongsTo(models.groups, { foreignKey: "groupId" });
// Member user fk
models.members.belongsTo(models.users, { foreignKey: "userId" });

module.exports = models;
