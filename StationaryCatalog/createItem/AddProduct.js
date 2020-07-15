const express = require("express");
const router = express.Router();
const PutKeywords = require("../populateData/PutKeywords");
const RetractKeywords = require("../populateData/RetractKeywords");

const MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");

route1 = router.route("/");
route2 = router.route("/test");

//creating mongo connection
//mongo db connection service

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect(
      "mongodb+srv://joy:Joy@1995@cluster0-szqhn.mongodb.net/test?retryWrites=true&w=majority",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log("connected");

    const db = client.db("StationaryStop");
    const collection = db.collection("localCatalog");

    await operations(collection, client);
  } catch (err) {
    console.log("error is ", err);
    res.json({ status: "failed" }).status(401);
  }
};

//update sql table
var updateSQL = (res, id, data) => {
  var title = data.title;
  var category = data.category;
  var description = data.description;

  var currDB = local;

  var db = mysql.createConnection({
    host: currDB.host,
    user: currDB.Username,
    password: currDB.Password,
    database: currDB.DBname,
  });

  db.connect((err) => {
    if (err) {
      throw err;
    }
    console.log("mysql server connected");
  });

  var temp = "${}";

  var queryStr =
    "INSERT INTO product VALUES('" +
    id +
    "','" +
    title +
    "','" +
    category +
    "','" +
    description +
    "')";

  db.query(queryStr, (err, result) => {
    if (err) {
      console.log("in error of qsl");
      retractMongo(id, res).then((result, err) => {
        if (result) {
          res.json({ status: "failed", location: "sql" }).status(401);
        } else {
          res.send("unable to delete json").status(401);
        }
      });
    } else {
      res.json({ status: "success", ...{ result } });
    }
  });
};

var updateMongo = (res, data) => {
  var tempd = data.info;
  try {
    withDB(async (db) => {
      db.insertOne(tempd, (err, result) => {
        if (err) {
          console.log("error in mongo upload");
          //retract keywords if mongo operation fails
          res.json({ status: "failed" }).status(401);
        } else {
          //update sql database
          updateSQL(res, result.ops[0]._id, data.info);
        }
      });
    }, res);
  } catch (e) {
    console.log("in catch", e);
    res.json({ status: "error" }).status(500);
  }
};

//retract mongo input values
var retractMongo = (id, res) => {
  return new Promise((resolve, reject) => {
    try {
      withDB(async (db) => {
        db.deleteOne({ _id: new ObjectId(id) }, function (err, result) {
          if (err) {
            reject("unable to retract");
          } else {
            resolve("retracted");
          }
        });
      }, res);
    } catch (e) {
      console.log("in catch", e);
      reject("unable to retract");
    }
  });
};

/////////////////////////////////////////////////////////////////--REST CALLS

// put keywords in the file
route1.post(async (req, res) => {
  var data = req.body;
  console.log("in put keywords", data.keys);

  //put the keywords
  PutKeywords(req, res, data.keys).then((result, err) => {
    console.log("in then");
    if (result) {
      console.log(result);
      updateMongo(res, data);
    } else {
      res
        .json({ status: "unable to upload ,break at keyword upload" })
        .status(401);
    }
  });
});

//for testing purposes only
route2.post((req, res) => {
  console.log("in test");
  var data = req.body;

  try {
    withDB(async (db) => {
      await db.insertOne(data, (err, result) => {
        if (err) {
          res.json(err);
        } else res.json(result.ops[0]._id);
      });
    }, res);
  } catch (e) {
    console.log("in catch", e);
    res.json({ status: "error" }).status(500);
  }
});

module.exports = router;
