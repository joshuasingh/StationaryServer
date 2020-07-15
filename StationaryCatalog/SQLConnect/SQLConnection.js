var mysql = require("mysql");
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");

const createSQlConnection = () => {
  var currDB = local;

  var db = mysql.createConnection({
    host: currDB.host,
    user: currDB.Username,
    password: currDB.Password,
    database: currDB.DBname,
  });

  return db;
};

module.exports = createSQlConnection;
