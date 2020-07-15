var express = require("express");
var router = express.Router();
var MongoClient = require("mongodb").MongoClient;
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");
const withDB = require("../MongoConnect/MongoConn");
const ObjectId = require("mongodb").ObjectID;

const route1 = router.route("/increaseItemCount");
const route2 = router.route("/decrementCount");

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

//increment the item count in the cart
const incrementCount = (cartId, id, res) => {
  return new Promise((resolve, reject) => {
    cartId = new ObjectId(cartId);
    id = new ObjectId(id);

    withDB(
      async (coll) => {
        await coll.findOneAndUpdate(
          { _id: cartId, "items.id": id },
          { $inc: { "items.$.itemCount": 1 } },
          { returnOriginal: false },
          function (err, documents) {
            if (err) reject(err);
            else resolve(documents);
          }
        );
      },
      res,
      "UserCart"
    );
  });
};

//decrement the itemcount in the cart
const decrementCount = (cartId, id, res) => {
  return new Promise((resolve, reject) => {
    cartId = new ObjectId(cartId);
    id = new ObjectId(id);

    withDB(
      async (coll) => {
        await coll.findOneAndUpdate(
          { _id: cartId, "items.id": id },
          { $inc: { "items.$.itemCount": -1 } },
          { returnOriginal: false },
          function (err, documents) {
            if (err) reject(err);
            else resolve(documents);
          }
        );
      },
      res,
      "UserCart"
    );
  });
};

/////////////////////////routes
route1.post(async (req, res) => {
  var id = req.body.id;
  var userId = req.body.userId;

  console.log("in userId", id, userId);

  try {
    var cartId = await getMongoId(userId);
    var result = await incrementCount(cartId, id, res);

    console.log("result values", result.value.items);
    res
      .json({
        status: "success",
        message: "incremented",
        update: result.value.items,
      })
      .status(200);
  } catch (e) {
    console.log("error occured", e);
    res.json({ status: "failed", message: "unabe to increment" }).status(401);
  }
});

route2.post(async (req, res) => {
  var id = req.body.id;
  var userId = req.body.userId;

  console.log("in userId", id, userId);

  try {
    var cartId = await getMongoId(userId);
    var result = await decrementCount(cartId, id, res);

    res
      .json({
        status: "success",
        message: "incremented",
        update: result.value.items,
      })
      .status(200);
  } catch (e) {
    console.log("error occured", e);
    res.json({ status: "failed", message: "unabe to decrement" }).status(401);
  }
});

module.exports = router;
