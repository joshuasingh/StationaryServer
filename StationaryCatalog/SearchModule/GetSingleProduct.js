const express = require("express");
const router = express.Router();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
const { open, local } = require("../Security/sqlKeys.json");
const withDB1 = require("../MongoConnect/MongoConn");
const mysql = require("mysql");

const route1 = router.route("/");

//mongo connection
const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect(
      "mongodb+srv://joy:Joy@1995@cluster0-szqhn.mongodb.net/test?retryWrites=true&w=majority",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log("connected");

    const db = client.db("StationaryStop");
    const collection = db.collection("Catalog");

    await operations(collection, client);
  } catch (err) {
    console.log("error is ", err);
    res.json({ status: "failed", message: err, result: null }).status(401);
  }
};

var getProductInfo = (id, res) => {
  return new Promise((resolve, reject) => {
    try {
      withDB(async (db) => {
        db.findOne({ _id: id }).then((result, err) => {
          if (err) reject("error" + err);
          else {
            resolve(result);
          }
        });
      }, res);
    } catch (e) {
      reject("error" + e);
    }
  });
};

const checkItemPresence = (cartId, Id, res) => {
  return new Promise(async (resolve, reject) => {
    cartId = new ObjectId(cartId);

    console.log("in checkt item prese");

    withDB1(
      async (coll) => {
        coll.aggregate();

        await coll.aggregate(
          [
            { $match: { _id: cartId } },
            { $match: { "items.id": Id } },
            { $count: "count" },
          ],
          function (err, result) {
            console.log("in callback");
            if (err) reject(err);
            else {
              result.next((err, res1) => {
                if (err) reject(err);
                if (res1 === null) resolve("no");
                else resolve("yes");
              });
            }
          }
        );
      },
      res,
      "UserCart"
    );
  });
};

//get mongoId of cart from cart table
const getMongoId = (userId) => {
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

      var queryStr =
        "select cartId from userCart where userId=+'" + userId + "'";
      db.query(queryStr, (err, result) => {
        if (err) {
          reject(err);
        } else {
          console.log("rsult", result);
          if (result.length !== 0) {
            resolve(result[0].cartId);
          } else {
            reject("failed");
          }
        }
      });
    });
  });
};

//-----------------------------------------------router action---------------------------------
route1.post(async (req, res) => {
  console.log("in getting single product fetch", req.body.userId);
  var id = new ObjectId(req.body.id);
  var userId = req.body.userId;

  var result;
  try {
    result = await getProductInfo(id, res);
    //get the cart presence
    var cartId = await getMongoId(userId);
    var verify_Presence = await checkItemPresence(cartId, id, res);

    res.json({ status: "success", result: result, present: verify_Presence });
  } catch (e) {
    console.log("in error ", e);
    res.json({ status: "failed", message: e, result: null }).status(401);
  }
});

module.exports = router;
