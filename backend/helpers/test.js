"use strict";

const models = require("../models/model_relations");
const db = require("../database_scripts/database");

const options = {
  where: {
    currencyId: 1,
    userId: 1,
    groupId: 1,
  },
};
models.groupBalances
  .findOrCreate(options)
  .then(console.log("DELETE FROM TABLE"));
