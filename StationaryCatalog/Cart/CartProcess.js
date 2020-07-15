var express = require("express");
var app = express();
var router = express.Router();
var MongoClient = require("mongodb").MongoClient;
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");
const withDB = require("../MongoConnect/MongoConn");
const ObjectId = require("mongodb").ObjectID;

const route1 = router.route("/InsertItems");
const route2 = router.route("/getCartItems/:id");
const route3 = router.route("/deleteItems");
const route4 = router.route("/cartPresence");

const createCart = (res) => {
  try {
    withDB(
      async (collection, client) => {
        await collection.insertOne(data, (err, result) => {
          if (err) res.json({ status: "failed", message: err });
          else res.json({ status: "success", message: result });
        });
      },
      res,
      "UserCart"
    );
  } catch (e) {}
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

//add items to the cart in mongo
const insertItems = (id, item, res) => {
  return new Promise((resolve, reject) => {
    id = new ObjectId(id);
    item.id = new ObjectId(item.id);

    withDB(
      async (coll) => {
        await coll
          .update({ _id: id }, { $addToSet: { items: item } })
          .then((res, err) => {
            if (err) reject(err);
            else resolve(res);
          })
          .catch((e) => {
            console.log("duplicate entry", e);
            reject(e);
          });
      },
      res,
      "UserCart"
    );
  });
};

const getCartItems = (cartId, res) => {
  return new Promise((resolve, reject) => {
    let id = new ObjectId(cartId);

    withDB(
      async (coll) => {
        await coll.findOne({ _id: id }).then((res, err) => {
          if (err) reject(err);
          else resolve(res);
        });
      },
      res,
      "UserCart"
    );
  });
};

const removeItem = (cartId, Id, res) => {
  return new Promise((resolve, reject) => {
    cartId = new ObjectId(cartId);
    Id = new ObjectId(Id);

    withDB(
      async (coll) => {
        await coll.findOneAndUpdate(
          { _id: cartId },
          { $pull: { items: { id: Id } } },
          { returnOriginal: false },
          function (err, documents) {
            if (err) {
              console.log("unction err", err);
              reject(err);
            } else {
              console.log("unction succ", documents);
              resolve(documents);
            }
          }
        );
      },
      res,
      "UserCart"
    );
  });
};

const checkItemPresence = (cartId, id, res) => {
  return new Promise(async (resolve, reject) => {
    cartId = new ObjectId(cartId);
    Id = new ObjectId(id);

    console.log("in checkt item prese");

    withDB(
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
                if (res1 === null) resolve("not_present");
                else resolve("present");
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

/////////////////////////routes
route1.post(async (req, res) => {
  var { userId, item } = req.body;
  console.log(userId);
  try {
    var cartId = await getMongoId(userId);
    var result = await insertItems(cartId, item, res);

    console.log("result", result.result.nModified);
    let message = "cart updated";
    if (result.result.nModified === 0) message = "duplicate_entry";
    res.json({ status: "success", message: message }).status(200);
  } catch (e) {
    console.log("there is error", e);
    res
      .json({ status: "failed", message: "unable to update card" })
      .status(401);
  }
});

route2.get(async (req, res) => {
  const userId = req.params.id;
  console.log("user", userId);

  try {
    var cartId = await getMongoId(userId);
    var result = await getCartItems(cartId, res);
    res.json({ status: "success", items: result.items }).status(200);
  } catch (e) {
    console.log("error in catch", e);
    res
      .json({ status: "failed", message: "unable to get cart products" })
      .status(401);
  }
});

route3.post(async (req, res) => {
  var id = req.body.id;
  var userId = req.body.userId;

  console.log("in userId", id, userId);

  try {
    var cartId = await getMongoId(userId);
    var result = await removeItem(cartId, id, res);

    res.json({ status: "success", update: result.value }).status(200);
  } catch (e) {
    console.log("error in removal", e);

    res.json({ status: "failed", message: "unable to delete" }).status(401);
  }
});

route4.post(async (req, res) => {
  var { id, userId } = req.body;

  try {
    var cartId = await getMongoId(userId);
    var result = await checkItemPresence(cartId, id, res);

    res.json({ status: "success", result: result }).status(200);
  } catch (e) {
    console.log("error", e);
    res.json({ status: "failed", result: e }).status(401);
  }
});

module.exports = router;
