const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const myPlaintextPassword = "joshua@099";
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");

var route1 = router.route("/verify");

var verifyNo = (phoneNo, pass) => {
  return new Promise((resolve, reject) => {
    var currDB = local;

    try {
      //remove 0 from starting of the phone numbers
      let i = 0;
      while (phoneNo[i] === "0") i++;
      phoneNo = phoneNo.slice(i, phoneNo.lengths);
    } catch (e) {
      reject(e);
    }

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
        "select phoneNo,phn_code,passwordVal from UserAccount where phoneNo='" +
        phoneNo +
        "'";

      db.query(queryStr, (err, result) => {
        if (err) {
          console.log("err", err);
          reject(err);
        } else {
          console.log("result is", result);
          if (result.length !== 0) {
            result = result[0];
            console.log(result.passwordVal);
            bcrypt.compare(pass, result.passwordVal, (err, res) => {
              if (err) reject(err);

              if (res === true) {
                resolve({ val: "present", data: result });
              } else resolve({ val: "not_present" });
            });
          } else resolve({ val: "not_present" });
        }
      });
    });
  });
};

///////////////////////////////all routes
route1.post(async (req, res) => {
  var { phoneNo, password } = req.body;

  try {
    console.log("has value");
    var phns = await verifyNo(phoneNo, password);

    console.log(("phn value", phns));
    if (phns.val === "present") {
      res
        .json({ status: "success", message: "Verified", userData: phns.data })
        .status(200);
    } else res.json({ status: "success", message: "not_Verified" }).status(200);
  } catch (e) {
    res
      .json({ status: "failed", message: "unable to login", error: e })
      .status(401);
  }
});

module.exports = router;
