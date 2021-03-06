"use strict";

// imports
const numeral = require("numeral");
const jwt = require("jsonwebtoken");
const config = require("../configuration/config");
const models = require("../models/model_relations");
const { Op } = require("sequelize");

module.exports = {
  checkIfTokenExists: (req, res, next) => {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== "undefined") {
      const bearerHeaderParts = bearerHeader.split(" ");
      if (bearerHeaderParts.length == 2) {
        req.token = bearerHeaderParts[1];
        next();
        return;
      }
    }
    res.status(401).send({
      errorMessage: "Please login to continue",
    });
    return;
  },
  verifyToken: (req, res, next) => {
    try {
      req.user = jwt.verify(req.token, config.jwt.secretKey);
      next();
      return;
    } catch (err) {
      res.status(401).send({
        errorMessage: "Please login to continue",
      });
      return;
    }
  },
  status: {
    inviteAccepted: "INVITE_ACCEPTED",
    inviteRejected: "INVITE_REJECTED",
    inviteSent: "INVITE_SENT",
    leftGroup: "LEFT_GROUP",
  },
  updateOrCreate: async (model, where, newItem) => {
    const foundItem = await model.findOne({ where });
    if (!foundItem) {
      // Item not found, create a new one
      const item = await model.create(newItem);
      return { item, created: true };
    }
    // Found an item, update it
    const item = await model.update(newItem, { where });
    return { item, created: false };
  },
  getGroupBalanceStatement: (amount, currencySymbol) => {
    if (amount < 0)
      return "owes " + currencySymbol + numeral(-1 * amount).format("0.[00]");
    else if (amount > 0)
      return "gets back " + currencySymbol + numeral(amount).format("0.[00]");
    else return null;
  },
  getPersonalOwesYouBalanceStatement: (
    userName,
    currencySymbol,
    groupName,
    amount
  ) => {
    return (
      userName +
      " owes you " +
      currencySymbol +
      numeral(amount).format("0.[00]") +
      " for " +
      groupName +
      "."
    );
  },
  getPersonalOwingBalanceStatement: (
    userName,
    currencySymbol,
    groupName,
    amount
  ) => {
    return (
      "You owe " +
      userName +
      " " +
      currencySymbol +
      numeral(amount).format("0.[00]") +
      " for " +
      groupName +
      "."
    );
  },
  settleUpTheUsers: async (rawDebt, transaction) => {
    // find paidBy userId and paidTo userId
    const [toBepaidByUserId, toBepaidToUserId] =
      rawDebt.amount < 0
        ? [rawDebt.userId1, rawDebt.userId2]
        : [rawDebt.userId2, rawDebt.userId1];

    // find amount to be paid
    const amountToBePaid =
      rawDebt.amount < 0 ? -1 * rawDebt.amount : rawDebt.amount;

    // Add expense
    const expense = await models.expenses.create(
      {
        description: "Settle balance",
        amount: amountToBePaid,
        groupId: rawDebt.groupId,
        paidByUserId: toBepaidByUserId,
        currencyId: rawDebt.currencyId,
        transactionTypeId: toBepaidToUserId,
      },
      { transaction }
    );

    // Update Group Balances
    const groupBalanceOfPayer = await models.groupBalances.findOne({
      where: {
        userId: toBepaidByUserId,
        groupId: rawDebt.groupId,
        currencyId: rawDebt.currencyId,
      },
    });
    const groupBalanceOfPayee = await models.groupBalances.findOne({
      where: {
        userId: toBepaidToUserId,
        groupId: rawDebt.groupId,
        currencyId: rawDebt.currencyId,
      },
    });

    groupBalanceOfPayer.balance = groupBalanceOfPayer.balance + amountToBePaid;
    groupBalanceOfPayee.balance = groupBalanceOfPayee.balance - amountToBePaid;
    await groupBalanceOfPayer.save({ transaction });
    await groupBalanceOfPayee.save({ transaction });

    // Add activities for Settling Up

    // Get most recent activity of payer
    const recentActivityOfPayer = await models.activities.findOne({
      order: [["createdAt", "DESC"]],
      where: {
        currencyId: rawDebt.currencyId,
        userId: toBepaidByUserId,
      },
    });
    // Get most recent activity of Payee
    const recentActivityOfPayee = await models.activities.findOne({
      order: [["createdAt", "DESC"]],
      where: {
        currencyId: rawDebt.currencyId,
        userId: toBepaidToUserId,
      },
    });
    // Get most recent group activity of Payer
    const recentGroupActivityOfPayer = await models.activities.findOne({
      order: [["createdAt", "DESC"]],
      where: {
        currencyId: rawDebt.currencyId,
        userId: toBepaidByUserId,
      },
      include: [
        {
          model: models.expenses,
          attributes: ["id", "groupId"],
          where: {
            id: {
              [Op.ne]: expense.id,
            },
            groupId: rawDebt.groupId,
          },
          required: true,
        },
      ],
    });
    // Get most recent group activity of Payee
    const recentGroupActivityOfPayee = await models.activities.findOne({
      order: [["createdAt", "DESC"]],
      where: {
        currencyId: rawDebt.currencyId,
        userId: toBepaidToUserId,
      },
      include: [
        {
          model: models.expenses,
          attributes: ["id", "groupId"],
          where: {
            id: {
              [Op.ne]: expense.id,
            },
            groupId: rawDebt.groupId,
          },
          required: true,
        },
      ],
    });

    // Create new activity for payer
    await models.activities.create(
      {
        userId: toBepaidByUserId,
        currencyId: rawDebt.currencyId,
        expenseId: expense.id,
        totalBalance: recentActivityOfPayer.totalBalance + amountToBePaid,
        groupBalance: recentGroupActivityOfPayer.groupBalance + amountToBePaid,
        expenseBalance: 0,
      },
      { transaction }
    );

    // Create new activity for payee
    await models.activities.create(
      {
        userId: toBepaidToUserId,
        currencyId: rawDebt.currencyId,
        expenseId: expense.id,
        totalBalance: recentActivityOfPayee.totalBalance - amountToBePaid,
        groupBalance: recentGroupActivityOfPayee.groupBalance - amountToBePaid,
        expenseBalance: 0,
      },
      { transaction }
    );

    // Set debt amount to zero
    rawDebt.amount = 0;
    await rawDebt.save({ transaction });
  },
  // Get recent activity statment
  recentActivityDescriptionStatement: async (
    recentActivity,
    loggedInUserId
  ) => {
    if (recentActivity.expense.transactionTypeId != 0) {
      const usersSet = new Set([
        loggedInUserId,
        recentActivity.expense.paidByUserId,
        recentActivity.expense.transactionTypeId,
      ]);
      usersSet.delete(loggedInUserId);
      const userDetails = await models.users.findOne({
        where: {
          id: Array.from(usersSet),
        },
        attributes: ["name"],
      });
      return (
        "You and " +
        userDetails.name.charAt(0) +
        userDetails.name.slice(1) +
        " settled up."
      );
    } else if (recentActivity.expense.user.id === loggedInUserId) {
      return (
        "You added " +
        '"' +
        recentActivity.expense.description +
        '" in ' +
        '"' +
        recentActivity.expense.group.name +
        '".'
      );
    } else {
      // First letter capital of the user's name who financed the expense
      return (
        recentActivity.expense.user.name.charAt(0).toUpperCase() +
        recentActivity.expense.user.name.slice(1) +
        " added " +
        '"' +
        recentActivity.expense.description +
        '" in ' +
        '"' +
        recentActivity.expense.group.name +
        '".'
      );
    }
  },
  // Get recent activity balance statemnet
  recentActivityBalanceStatement: (recentActivity, isItGroupActivitiesOnly) => {
    if (isItGroupActivitiesOnly) {
      if (recentActivity.groupBalance > 0) {
        return (
          "In this group, you get back " +
          recentActivity.expense.currency.symbol +
          numeral(recentActivity.groupBalance).format("0.[00]") +
          "."
        );
      } else if (recentActivity.groupBalance < 0) {
        return (
          "In this group, you owe " +
          recentActivity.expense.currency.symbol +
          numeral(-1 * recentActivity.groupBalance).format("0.[00]") +
          "."
        );
      } else {
        return "You accounts are settled up in this group.";
      }
    } else {
      if (recentActivity.totalBalance > 0) {
        return (
          "Across all the groups, you get back " +
          recentActivity.expense.currency.symbol +
          numeral(recentActivity.totalBalance).format("0.[00]") +
          "."
        );
      } else if (recentActivity.totalBalance < 0) {
        return (
          "Across all the groups, you owe " +
          recentActivity.expense.currency.symbol +
          numeral(-1 * recentActivity.totalBalance).format("0.[00]") +
          "."
        );
      } else {
        return "You accounts are settled up in all groups.";
      }
    }
  },
  getNewGroupDataFormData: (fields, files) => {
    return Object.assign(
      ...Object.keys(fields).map((key) => {
        if (fields[key].length == 1) return { [key]: fields[key][0] };
        else if (fields[key].length >= 2 && key == "users")
          return { [key]: fields[key].map((value) => Number(value)) };
      }),
      {
        image:
          Object.keys(files).length == 0
            ? null
            : files.image[0].originalFilename,
      }
    );
  },
  recentActivityExpenseStatement: (recentActivity) => {
    if (recentActivity.expenseBalance > 0) {
      return (
        "For this expense, you get back " +
        recentActivity.expense.currency.symbol +
        recentActivity.expenseBalance +
        "."
      );
    } else if (recentActivity.expenseBalance < 0) {
      return (
        "For this expense, you owe " +
        recentActivity.expense.currency.symbol +
        -1 * recentActivity.expenseBalance +
        "."
      );
    }
  },
};
