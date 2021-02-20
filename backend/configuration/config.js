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
config.database.maxIdleTime = 30;
config.database.ssl = "Amazon RDS";

// exporting config file
module.exports = config;
