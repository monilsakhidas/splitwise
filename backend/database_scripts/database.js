"use strict";

// config file
const config = require("../configuration/config");
const Sequelize = require("sequelize");
const db = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    logging: console.log,
    maxConcurrentQueries: config.database.maxConcurrentQueries,
    dialect: config.database.dialect,
    ssl: config.database.ssl,
    pool: {
      maxConnections: config.database.maxConnections,
      maxIdleTime: config.database.maxIdleTime,
    },
    language: config.database.language,
  }
);

module.exports = db;
