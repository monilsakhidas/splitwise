"use strict";

// Imports
const express = require("express");
const utils = require("../helpers/utils");
const Joi = require("joi");
const models = require("../models/model_relations");
const db = require("../database_scripts/database");
const config = require("../configuration/config");
const { status } = require("../helpers/utils");
const { Op } = require("sequelize");
const router = express.Router();

// Create group
router.post(
  "/create",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const schema = Joi.object({
      name: Joi.string().min(1).max(64).required().messages({
        "any.required": "Group name is required",
        "string.empty": "Group name cannot be empty.",
        "string.max": "Name of the group should be lesser than 64 characters",
        "string.min": "Group name cannot be empty",
      }),
      image: Joi.string(),
      users: Joi.array()
        .min(1)
        .required()
        .items(Joi.number().positive())
        .unique()
        .messages({
          "any.required": "Select atleast 1 user to form a group.",
          "array.min": "Select atleast 1 user to form a group.",
          "number.positive": "Select a valid user.",
          "array.unique": "Can't add the same user multiple times.",
        }),
    });
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    } else if (req.body.users.includes(req.user.id)) {
      res.status(400).send({
        errorMessage:
          "Cannot select yourself as a group member. You will automatically added into the group as you are creating it.",
      });
      return;
    }
    const transaction = await db.transaction();
    try {
      // Create group
      const group = await models.groups.create(
        {
          createdBy: req.user.id,
          name: req.body.name,
          image: req.body.image,
          groupStrength: 1,
        },
        { transaction: transaction }
      );
      // Create a list of member objects with userId that are to be saved in the database
      const members = await req.body.users.map((userId) => {
        return {
          userId,
          groupId: group.id,
          status: status.inviteSent,
        };
      });
      // Creating admin entry in the Members group
      members.push({
        userId: req.user.id,
        groupId: group.id,
        status: status.inviteAccepted,
      });
      // Creating all people's bulk entry in the members group
      await models.members.bulkCreate(members, { transaction: transaction });
      res.status(200).send({
        id: group.id,
        name: group.name,
        image: group.image,
        createdBy: group.createdBy,
        groupStrength: group.groupStrength,
      });
      await transaction.commit();
    } catch (err) {
      if (err.name === config.errors.uniqueErrorName) {
        res.status(400).send({
          errorMessage: "Group with this name already exists.",
        });
      } else if (err.name === config.errors.foreignKeyError) {
        res.status(400).send({
          errorMessage: "Add only valid users in the group.",
        });
      } else {
        res.status(400).send({ errorMessage: err });
      }
      await transaction.rollback();
    }
  }
);

// Get all the groups the user is member of
router.get(
  "/mygroups",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // Finding all groups whose user is a member of
    const groupMemberships = await models.members.findAll({
      where: { userId: req.user.id, status: status.inviteAccepted },
    });
    // Extracting all the groupIds
    const groupIds = await groupMemberships.map((groupMembership) => {
      return groupMembership.groupId;
    });
    // Querying group objects from db based on the groupIds
    const groups = await models.groups.findAll({
      attributes: ["id", "name", "groupStrength", "createdAt", "createdby"],
      where: {
        id: {
          [Op.in]: groupIds,
        },
      },
    });
    res.status(200).send({ groups });
  }
);

// Get all the groups user is invited to
router.get(
  "/invitations",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // Finding all groups whose user is a member of
    const groupMemberships = await models.members.findAll({
      where: { userId: req.user.id, status: status.inviteSent },
    });
    // Extracting all the groupIds
    const groupIds = await groupMemberships.map((groupMembership) => {
      return groupMembership.groupId;
    });
    // Querying group objects from db based on the groupIds
    const groups = await models.groups.findAll({
      attributes: ["id", "name", "createdAt", "createdBy"],
      order: [["createdAt", "DESC"]],
      where: {
        id: {
          [Op.in]: groupIds,
        },
      },
    });
    res.status(200).send({ groups });
  }
);

// Accept an invitation
router.post(
  "/accept",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // contruct expected schema
    const schema = Joi.object({
      id: Joi.number().positive().required().messages({
        "any.required": "Select a valid group",
        "number.positive": "Select a valid group",
        "number.base": "Select a valid group",
        "number.integer": "Select a valid group",
      }),
    });
    // validate schema
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    // Find group membership
    models.members
      .findOne({
        where: {
          groupId: req.params.id,
          userId: req.user.id,
          status: status.inviteSent,
        },
      })
      .then(async (groupMembership) => {
        if (groupMembership == null) {
          res.status(400).send({
            errorMessage: "No such invite found.",
          });
          return;
        }
        // change the status to Invite accepted
        groupMembership.status = status.inviteAccepted;
        groupMembership
          .save()
          .then(async () => {
            // Finding the group instance whose groupStrength needs to be incremented
            const group = await models.groups.findOne({
              where: {
                id: req.params.id,
              },
            });
            // Incrementing group strength as the invite is accepted
            await group.increment("groupStrength");
            // Sending successful response
            res.status(200).send({
              groupMembershipId: groupMembership.id,
              groupId: groupMembership.groupId,
              message: "Invite accepted",
            });
            return;
          })
          .catch((err) => {
            res.status(400).send({ errorMessage: err });
          });
      })
      .catch((err) => {
        res.status(400).send({ errorMessage: err });
      });
  }
);

// Reject an invitation
router.post(
  "/reject",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // contruct expected schema
    const schema = Joi.object({
      id: Joi.number().positive().required().messages({
        "any.required": "Select a valid group",
        "number.positive": "Select a valid group",
        "number.base": "Select a valid group",
        "number.integer": "Select a valid group",
      }),
    });
    // validate schema
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    // Find group membership
    models.members
      .findOne({
        where: {
          groupId: req.params.id,
          userId: req.user.id,
          status: status.inviteSent,
        },
      })
      .then(async (groupMembership) => {
        if (groupMembership == null) {
          res.status(400).send({
            errorMessage: "No such invite found.",
          });
          return;
        }
        // change the status to Invite rejected
        groupMembership.status = status.inviteRejected;
        groupMembership
          .save()
          .then(
            res.status(200).send({
              groupMembershipId: groupMembership.id,
              groupId: groupMembership.groupId,
              message: "Invite rejected",
            })
          )
          .catch((err) => {
            res.status(400).send({ errorMessage: err });
          });
      })
      .catch((err) => {
        res.status(400).send({ errorMessage: err });
      });
  }
);

// Leave a group
router.post(
  "/leave",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // contruct expected schema
    const schema = Joi.object({
      id: Joi.number().positive().required().messages({
        "any.required": "Select a valid group",
        "number.positive": "Select a valid group",
        "number.base": "Select a valid group",
        "number.integer": "Select a valid group",
      }),
    });
    // validate schema
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    const groupMembership = await models.members.findOne({
      where: {
        groupId: req.body.id,
        userId: req.user.id,
        status: status.inviteAccepted,
      },
    });
    // If not a member
    if (!groupMembership) {
      res.status(400).send({ errorMessage: "Select a valid group" });
      return;
    } else {
      const listOfGroupBalances = await models.groupBalances.findAll({
        where: { groupId: req.body.id, userId: req.user.id },
      });
      // If none exists than the user might have just joined the group and wants to leave
      if (!listOfGroupBalances) {
        // leave group
        groupMembership.status = status.leftGroup;
        await groupMembership.save();
        await models.groups.decrement("groupStrength", {
          where: { id: req.body.id },
        });
        res.status(200).send({ message: "Left group successfully." });
        return;
      } else {
        const settledGroupBalances = await listOfGroupBalances.filter(
          (groupBalance) => groupBalance.balance != 0
        );
        if (settledGroupBalances.length != 0) {
          // There is something left to settle in the account
          res.status(400).send({
            errorMessage:
              "Cannot leave this group until the group balances are not settled.",
          });
          return;
        } else {
          // leave the group
          groupMembership.status = status.leftGroup;
          await groupMembership.save();
          await models.groups.decrement("groupStrength", {
            where: { id: req.body.id },
          });
          res.status(200).send({ message: "Left group successfully." });
          return;
        }
      }
    }
  }
);

// Update Group details such as image, name (Not adding or removing members as it is not the part of requirements)
router.put(
  "/editgroup",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // contruct expected schema
    const schema = Joi.object({
      name: Joi.string().min(1).max(64).required().messages({
        "any.required": "Group name is required",
        "string.empty": "Group name cannot be empty.",
        "string.max": "Name of the group should be lesser than 64 characters",
        "string.min": "Group name cannot be empty",
      }),
      image: Joi.string(),
      id: Joi.number().min(1).required().messages({
        "number.base": "Select a valid group",
        "any.required": "Select a valid group",
        "number.min": "Select a valid group",
      }),
    });
    // validate schema
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    // Find membership instance of accepted invite of the group whose details the user want to update
    models.members
      .findOne({
        where: {
          groupId: req.body.id,
          userId: req.user.id,
          status: status.inviteAccepted,
        },
      })
      .then(async (groupMembership) => {
        if (groupMembership == null) {
          res.status(400).send({
            errorMessage: "Select a valid group",
          });
          return;
        } else {
          // Find and update group
          const group = await models.groups.findOne({
            where: {
              id: groupMembership.groupId,
            },
          });
          group.name = req.body.name;
          group.image = req.body.image;
          group
            .save()
            .then(async (group) => {
              res.status(200).send({
                id: group.id,
                name: group.name,
                image: group.image,
                message: "Group details updated",
              });
            })
            .catch((err) => {
              if (err.name == config.errors.uniqueErrorName) {
                res.status(400).send({
                  errorMessage: "Group with this name already exists.",
                });
              } else {
                res.status(400).send({ errorMessage: err });
              }
            });
        }
      });
  }
);

// Add an expense
router.post(
  "/addexpense",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // Constructing a schema to validate input
    const schema = Joi.object({
      description: Joi.string().min(1).max(64).required().messages({
        "string.base": "Enter a valid string as description",
        "string.min": "Enter a valid description",
        "string.max": "Enter a description in less than 64 characters",
        "any.required": "Enter a description to record the expense",
      }),
      groupId: Joi.number().min(1).integer().required().messages({
        "number.base": "Select a valid group for adding expense",
        "number.min": "Select a valid group for adding expense",
        "any.required": "Select a valid group for adding expense",
      }),
      amount: Joi.number().positive().required().messages({
        "number.positive":
          "Enter a valid positive amount to record the expense",
        "number.base": "Enter a valid amount to record the expense",
        "any.required": "Enter an amount",
      }),
    });
    // Validating the input object
    const result = await schema.validate(req.body);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    // Check group membership
    const groupMembership = await models.members.findOne({
      where: {
        groupId: req.body.groupId,
        userId: req.user.id,
        status: status.inviteAccepted,
      },
    });
    // If not member of the group then return
    if (groupMembership == null) {
      res.status(400).send({
        errorMessage: "Enter a valid group",
      });
      return;
    } else {
      // Get currency from user
      const user = await models.users.findOne({
        where: {
          id: req.user.id,
        },
        attributes: ["currencyId"],
      });
      const currencyId = user.currencyId;

      // Get group instance for finding total members in the group
      const group = await models.groups.findOne({
        where: { id: req.body.groupId },
      });
      const totalMembersOfGroup = group.groupStrength;
      const partitionedAmount = req.body.amount / totalMembersOfGroup;
      // Start transaction
      // const transaction = await db.transaction({ autocommit: false });
      const transaction = await db.transaction();
      try {
        // Record expense entry in expenses table
        const expense = await models.expenses.create(
          {
            description: req.body.description,
            amount: req.body.amount,
            groupId: req.body.groupId,
            paidByUserId: req.user.id,
            currencyId: currencyId,
          },
          { transaction }
        );

        // Find all members of the group except the user initiating
        // the expense transaction
        const groupMembershipList = await models.members.findAll({
          where: {
            groupId: req.body.groupId,
            status: status.inviteAccepted,
          },
        });
        const membersList = await groupMembershipList
          .map((groupMembership) => {
            return groupMembership.userId;
          })
          .filter((userId) => userId != req.user.id);

        // Find or create/update group balances
        membersList.forEach(async (userId) => {
          const [
            groupBalance,
            isCreated,
          ] = await models.groupBalances.findOrCreate({
            where: {
              currencyId,
              userId,
              groupId: req.body.groupId,
            },
            defaults: {
              currencyId,
              userId,
              groupId: req.body.groupId,
              balance: -1 * partitionedAmount,
            },
            transaction,
          });
          if (!isCreated) {
            groupBalance.balance = groupBalance.balance - partitionedAmount;
            await groupBalance.save({ transaction: transaction });
          }
        });

        // Find or create user's group balance who financed the expense
        const [
          groupBalance,
          isCreated,
        ] = await models.groupBalances.findOrCreate({
          where: {
            currencyId,
            userId: req.user.id,
            groupId: req.body.groupId,
          },
          defaults: {
            currencyId,
            userId: req.user.id,
            groupId: req.body.groupId,
            balance: partitionedAmount * (totalMembersOfGroup - 1),
          },
          transaction,
        });

        if (!isCreated) {
          groupBalance.balance =
            groupBalance.balance +
            partitionedAmount * (totalMembersOfGroup - 1);
          await groupBalance.save({ transaction: transaction });
        }

        // Adding Debts with groupId
        membersList.forEach(async (userId) => {
          // Smaller userId will be userId1. The other would be userId2
          // Amount would be positive if the person financing the expense has smaller userId.
          const [userId1, userId2, amount] =
            req.user.id < userId
              ? [req.user.id, userId, partitionedAmount]
              : [userId, req.user.id, -1 * partitionedAmount];

          const [debt, isCreated] = await models.debts.findOrCreate({
            where: {
              userId1,
              userId2,
              currencyId,
              groupId: req.body.groupId,
            },
            defaults: {
              userId1,
              userId2,
              currencyId,
              groupId: req.body.groupId,
              amount,
            },
            transaction,
          });
          if (!isCreated) {
            debt.amount = debt.amount + amount;
            await debt.save({ transaction: transaction });
          }
        });

        // UPDATE ACTIVITIES OF ALL USERS WITH THE PERSON WHO IS FINANCING THE TRANSACTION
        // STEPS:
        // 1) Find last activity to get total balance using userId and currencyId
        // 2) if null then create and return
        // 3) else
        // 4) Find last group activity to get groupBalance (inner join expenseId with expenses)
        // 5) If null then create and return

        // Adding the user who is financing the expense
        membersList.push(req.user.id);

        membersList.forEach(async (userId) => {
          // Get most recent activity
          const recentActivity = await models.activities.findOne({
            order: [["createdAt", "DESC"]],
            where: {
              currencyId,
              userId,
            },
          });
          // create recent activity
          if (!recentActivity) {
            const createdRecentActivity = await models.activities.create(
              {
                userId,
                currencyId,
                expenseId: expense.id,
                totalBalance:
                  userId !== req.user.id
                    ? -1 * partitionedAmount
                    : (totalMembersOfGroup - 1) * partitionedAmount,
                groupBalance:
                  userId !== req.user.id
                    ? -1 * partitionedAmount
                    : (totalMembersOfGroup - 1) * partitionedAmount,
              },
              { transaction }
            );
          } else {
            // find last group activity
            const groupRecentActivity = await models.activities.findOne({
              order: [["createdAt", "DESC"]],
              where: { userId },
              include: [
                {
                  model: models.expenses,
                  required: true,
                  where: {
                    groupId: req.body.groupId,
                    currencyId,
                  },
                },
              ],
            });
            // If groupsRecentActivity did not exist! Then create it else use the previous groupBalance
            const createdGroupRecentActivity = await models.activities.create(
              {
                userId,
                currencyId,
                expenseId: expense.id,
                totalBalance:
                  userId !== req.user.id
                    ? recentActivity.totalBalance - partitionedAmount
                    : recentActivity.totalBalance +
                      (totalMembersOfGroup - 1) * partitionedAmount,
                groupBalance:
                  groupRecentActivity == null
                    ? userId !== req.user.id
                      ? -1 * partitionedAmount
                      : (totalMembersOfGroup - 1) * partitionedAmount
                    : groupRecentActivity.groupBalance +
                      (userId !== req.user.id
                        ? -1 * partitionedAmount
                        : (totalMembersOfGroup - 1) * partitionedAmount),
              },
              { transaction }
            );
          }
          await transaction.commit();
          res.status(200).send({ expense });
          return;
        });
      } catch (error) {
        console.log(error);
        await transaction.rollback();
        res.status(400).send(error);
        return;
      }
    }
  }
);

// Get group details using group Id
router.get(
  "/:id",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // Construct expected schema
    const schema = Joi.number().required().positive().integer().messages({
      "any.required": "Select a valid group",
      "number.positive": "Select a valid group",
      "number.base": "Select a valid group",
      "number.integer": "Select a valid group",
    });
    // Validate schema
    const result = await schema.validate(req.params.id);
    if (result.error) {
      res.status(400).send({ errorMessage: result.error.details[0].message });
      return;
    }
    const groupMembership = await models.members.findOne({
      where: { userId: req.user.id, status: status.inviteAccepted },
      include: [
        {
          model: models.groups,
          required: true,
          where: { id: req.params.id },
        },
      ],
    });

    if (!groupMembership) {
      // Group does not exist
      res.status(400).send({ errorMessage: "Select a valid group." });
    } else {
      res.status(200).send({ group: groupMembership.group });
    }
  }
);

// get group balances
// router.get(
//   "groupbalance/:id",
//   utils.checkIfTokenExists,
//   utils.verifyToken,
//   async (req, res) => {
//     // Construct expected schema
//     const schema = Joi.number().required().positive().integer().messages({
//       "any.required": "Select a valid group",
//       "number.positive": "Select a valid group",
//       "number.base": "Select a valid group",
//       "number.integer": "Select a valid group",
//     });
//     // Validate schema
//     const result = await schema.validate(req.params.id);
//     if (result.error) {
//       res.status(400).send({ errorMessage: result.error.details[0].message });
//       return;
//     }
//     const groupMembership = await models.members.findOne({
//       where: { userId: req.user.id, status: status.inviteAccepted },
//     });

//     if (!groupMembership) {
//       // Group does not exist
//       res.status(400).send({ errorMessage: "Select a valid group." });
//       return;
//     } else {
//       // Return formatted group balances

//       // groupBalances even with 0 amount to settle which we
//       // need to filter out and remove
//       const groupBalancesList = models.groupBalances.findAll({
//         where: { groupId: req.params.id },
//       });
//     }
//   }
// );

module.exports = router;
