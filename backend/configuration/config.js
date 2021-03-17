"use strict";

var config = {};

// Database configuration properties
config.database = {};

config.database.name = "splitwise";
config.database.host = "splitwise-db.chujwvgyk4ce.us-east-2.rds.amazonaws.com";
config.database.username = "admin";
config.database.password = "adminadmin";
config.database.port = 3306;
config.database.maxConcurrentQueries = 100;
config.database.dialect = "mysql";
config.database.language = "en";
config.database.maxConnections = 5;
config.database.max = 5;
config.database.idle = 10000;
config.database.maxIdleTime = 30;
config.database.ssl = "Amazon RDS";

// Secret Key for generating jwts
config.jwt = {};

config.jwt.secretKey = "secretkey";

// Setting error messages of sequalize
config.errors = {};

config.errors.uniqueErrorName = "SequelizeUniqueConstraintError";
config.errors.validationErrorName = "SequelizeValidationError";
config.errors.foreignKeyError = "SequelizeForeignKeyConstraintError";

// Setting global search limit
config.searchLimit = 10;

//Setting frontend url for cors
config.frontendUrl = process.env.frontendUrl || "http://localhost:3000";

// exporting config file
module.exports = config;
