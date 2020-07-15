const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const myPlaintextPassword = "joshua@099";
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");
const withDB = require("../MongoConnect/MongoConn");
const createSQlConnection = require("../SQLConnect/SQLConnection");

var route = router.route("/createAcc");
var route1 = router.route("/getAccountDets");

var inputSQl = (paramVal, passHash) => {
  return new Promise((resolve, reject) => {
    const { firstName, lastName, email, code, UserId } = paramVal;

    var { phoneNo } = paramVal;

    //remove 0 from starting of the phone numbers
    let i = 0;
    while (phoneNo[i] === "0") i++;
    phoneNo = phoneNo.slice(i, phoneNo.lengths);

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
        "INSERT INTO UserAccount(UserId,firstName,lastName,email,passwordVal,phoneNo,phn_code) VALUES('" +
        UserId +
        "','" +
        firstName +
        "','" +
        lastName +
        "','" +
        email +
        "','" +
        passHash +
        "','" +
        phoneNo +
        "','" +
        code +
        "')";

      db.query(queryStr, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve("success");
        }
      });
    });
  });
};

getAccountDets = (UserId) => {
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
        "select UserId,firstName,lastName,email from UserAccount where UserId='" +
        UserId +
        "'";

      db.query(queryStr, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });
};

//create cart in mongo for the current user
const createCart = (res) => {
  return new Promise((resolve, reject) => {
    withDB(
      (coll) => {
        coll.insertOne({ items: [] }, (err, result) => {
          if (err) reject(err);
          else {
            resolve({ id: result.insertedId });
          }
        });
      },
      res,
      "UserCart"
    );
  });
};

//
const setCartId = (userId, cartId) => {
  return new Promise((resolve, reject) => {
    var db = createSQlConnection();

    db.connect((err) => {
      if (err) {
        reject(err);
      }
      console.log("mysql server connected");

      var queryStr =
        "insert into userCart(cartId,userId) values('" +
        cartId +
        "','" +
        userId +
        "')";

      db.query(queryStr, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });
};

//////////////////request call
route.post((req, res) => {
  console.log("parmaval", req.body);
  const { password } = req.body;

  bcrypt.hash(password, saltRounds, async (err, hash) => {
    if (err) {
      res
        .json({
          status: "failed",
          message: "unable to create hash",
          error: err,
        })
        .status(401);
    }

    try {
      await inputSQl(req.body, hash);

      let mongoId = await createCart(res);

      console.log("id", mongoId);

      await setCartId(req.body.UserId, mongoId.id);

      res.json({ status: "success", message: "User Created" });
    } catch (e) {
      console.log("in catch error", e);
      let errMessage = e;
      if (e.errno !== null && e.errno === 1062) errMessage = "duplicate_user";

      res.json({
        status: "failed",
        message: "unable to create user ",
        error: errMessage,
      });
    }
  });
});

//get user account details
route1.post(async (req, res) => {
  var UserId = req.body.UserId;

  try {
    var user = await getAccountDets(UserId);
    if (user.length === 0)
      res.json({ status: "success", message: "No_User_Found" });
    else
      res.json({ status: "success", message: "user Retrieve", user: user[0] });
  } catch (e) {
    res.json({ status: "failed", message: "unable to get User", error: e });
  }
});

module.exports = router;
