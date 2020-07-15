var express = require("express");
var router = express.Router();
const mysql = require("mysql");

router.route("/").get((req, res) => {
  var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root1234",
    database: "stationary",
  });

  db.connect((err) => {
    if (err) {
      throw err;
    }
    console.log("server connected");
  });

  db.query("select * from temp", (err, rows, fields) => {
    console.log("we got the result", rows);
    res.json(rows);
  });
});

module.exports = router;
