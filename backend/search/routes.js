"use strict";
const express = require("express");
const utils = require("../helpers/utils");
const models = require("../models/model_relations");
const Joi = require("joi");
const { Op } = require("sequelize");
const config = require("../configuration/config");
const { status } = require("../helpers/utils");
const router = express.Router();

// search all users using email and name
router.get(
  "/users",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const keywordValidation = Joi.string().required().min(1).messages({
      "string.required": "Keyword is required for searching users",
    });
    const result = await keywordValidation.validate(req.query.keyword);
    if (result.error) {
      res.status(200).send({ users: [] });
      return;
    }
    models.users
      .findAll({
        where: {
          id: {
            [Op.ne]: req.user.id,
          },
          [Op.or]: [
            {
              name: {
                [Op.like]: `%${req.query.keyword}%`,
              },
            },
            {
              email: {
                [Op.like]: `%${req.query.keyword}%`,
              },
            },
          ],
        },
        attributes: ["id", "name", "email"],
        limit: config.searchLimit,
      })
      .then((users) => res.status(200).send({ users }))
      .catch((err) => res.status(400).send(err));
  }
);

// search all groups whose user is a member of
router.get(
  "/mygroups",
  utils.checkIfTokenExists,
  utils.verifyToken,
  async (req, res) => {
    const keywordValidation = Joi.string().required().min(1).messages({
      "string.required": "Keyword is required for searching users",
    });
    const result = await keywordValidation.validate(req.query.keyword);
    if (result.error) {
      res.status(200).send({ users: [] });
      return;
    }

    // Finding all groups whose user is a member of
    const groupMemberships = await models.members.findAll({
      where: { userId: req.user.id, status: status.inviteAccepted },
    });
    // Extracting all the groupIds
    const groupIds = await groupMemberships.map((groupMembership) => {
      return groupMembership.groupId;
    });
    // Querying top 10 matching group objects from db based on the groupIds and search keyword
    const groups = await models.groups.findAll({
      attributes: ["id", "name", "createdAt", "createdby"],
      where: {
        id: {
          [Op.in]: groupIds,
        },
        name: {
          [Op.like]: `%${req.query.keyword}%`,
        },
      },
      limit: config.searchLimit,
      attributes: ["id", "name", "createdBy", "createdAt"],
    });
    res.status(200).send({ groups });
  }
);
module.exports = router;
