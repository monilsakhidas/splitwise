const mysql = require("mysql");

const dbConfig = {
  RDS_HOSTNAME: "splitwise-db.chujwvgyk4ce.us-east-2.rds.amazonaws.com",
  RDS_USERNAME: "admin",
  RDS_PASSWORD: "adminadmin",
  RDS_PORT: "3306",
};

const connection = mysql.createConnection({
  host: dbConfig.RDS_HOSTNAME,
  user: dbConfig.RDS_USERNAME,
  password: dbConfig.RDS_PASSWORD,
  port: dbConfig.RDS_PORT,
});

connection.connect(function (err) {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }

  console.log("Connected to database.");
});

connection.end();
