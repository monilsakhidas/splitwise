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
          groupStrength: req.body.users.length + 1,
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
      attributes: ["id", "name", "createdAt", "createdby"],
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
  "/accept/:id",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // contruct expected schema
    const schema = Joi.number().positive().required().messages({
      "any.required": "Select a valid group",
      "number.positive": "Select a valid group",
      "number.base": "Select a valid group",
    });
    // validate schema
    const result = await schema.validate(req.params.id);
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
          .then(
            res.status(200).send({
              groupMembershipId: groupMembership.id,
              groupId: groupMembership.groupId,
              message: "Invite accepted",
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

// Accept an invitation
router.post(
  "/reject/:id",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    // contruct expected schema
    const schema = Joi.number().positive().required().messages({
      "any.required": "Select a valid group",
      "number.positive": "Select a valid group",
      "number.base": "Select a valid group",
    });
    // validate schema
    const result = await schema.validate(req.params.id);
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
module.exports = router;
