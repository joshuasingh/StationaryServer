const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const myPlaintextPassword = "joshua@099";
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");

var route1 = router.route("/phoneNo");

var verifyNo = (phoneNo) => {
  return new Promise((resolve, reject) => {
    var currDB = local;

    var db = mysql.createConnection({
      host: currDB.host,
      user: currDB.Username,
      password: currDB.Password,
      database: currDB.DBname,
    });

    db.connect((err) => {
      if (err) {
        reject(err);
      }
      console.log("mysql server connected");

      var queryStr =
        "select count(*) as num from UserAccount where phoneNo=+'" +
        phoneNo +
        "'";
      db.query(queryStr, (err, result) => {
        if (err) {
          reject(err);
        } else {
          if (result[0].num !== 0) resolve("duplicate");
          resolve("success");
        }
      });
    });
  });
};

///////////////////////////////all routes
route1.post(async (req, res) => {
  var phoneNo = req.body.phoneNo;

  //remove 0 from starting of the phone numbers
  let i = 0;
  while (phoneNo[i] === "0") i++;
  phoneNo = phoneNo.slice(i, phoneNo.lengths);

  try {
    var check = await verifyNo(phoneNo);
    if (check === "duplicate")
      res.json({ status: "success", message: "duplicate_no" }).status(200);
    else {
      res.json({ status: "success", message: "not_duplicate" }).status(200);
    }
  } catch (e) {
    res
      .json({ status: "failed", message: "unable to get message", error: e })
      .status(401);
  }
});

module.exports = router;
