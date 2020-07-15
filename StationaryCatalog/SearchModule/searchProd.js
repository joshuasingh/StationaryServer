const express = require("express");
const router = express.Router();
var keyArr = require("../fileStore/UpdatedArray");
var getToken = require("../StringProcessing/strProcess");
var mysql = require("mysql");
const { open, local } = require("../Security/sqlKeys.json");
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;

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
    res.json({ status: "failed" }).status(401);
  }
};

//get data from mongo db
var getMongoData = (idArr, sArray, res) => {
  return new Promise((resolve, reject) => {
    try {
      withDB(async (db) => {
        db.find({ _id: { $in: idArr } }).toArray((err, result) => {
          if (err) reject("error" + err);
          else {
            result.sort(function (a, b) {
              return (
                sArray.indexOf(a._id.toString()) -
                sArray.indexOf(b._id.toString())
              );
            });

            resolve(result);
          }
        });
      }, res);
    } catch (e) {
      reject("error" + e);
    }
  });
};

var queryCreator = (strArr) => {
  var matchCol = ["title", "category", "description"];

  var baseQuery = "select distinct(tt.id),tt.title from( ";

  for (var i = 0; i < matchCol.length; i++) {
    if (i !== 0) baseQuery += " union ";

    baseQuery += "(select" + " outy.*,@n := @n + 1 n from (select p.* from( ";

    for (var j = 0; j < strArr.length; j++) {
      if (j !== 0) baseQuery += " union All ";
      baseQuery +=
        "select * from product where " +
        matchCol[i] +
        " like '%" +
        strArr[j] +
        "%'";
    }

    baseQuery +=
      ") p " +
      "GROUP BY p.id " +
      "ORDER BY count(*) DESC) outy,(SELECT @n := 0) m) ";
  }

  baseQuery += ") tt " + "order By tt.n ASC ";

  return baseQuery;
};

//query sql data
var querySQl = (res, arr, idArr, sArray) => {
  return new Promise((resolve, reject) => {
    console.log("array length", arr.length);
    var queryStr = queryCreator(arr);

    console.log("main Query", queryStr);

    var currDB = local;

    var db = mysql.createConnection({
      host: currDB.host,
      user: currDB.Username,
      password: currDB.Password,
      database: currDB.DBname,
    });

    db.connect((err) => {
      if (err) {
        reject("error occured", err);
      }
      console.log("mysql server connected");
    });

    var temp = "${}";

    db.query(queryStr, (err, result) => {
      if (err) {
        console.log("error from rejetc", err);
        reject("error occured", err);
      } else {
        result.map((val) => {
          sArray.push(val.id);
          idArr.push(new ObjectId(val.id));
        });

        //res.json(result);
        console.log("the result is", result);
        resolve("success");
      }
    });
  });
};

//-----------------------------------------------router action---------------------------------
route1.post(async (req, res) => {
  console.log(keyArr);

  var arr = getToken(req.body.searchStr);

  console.log("array value----------------", arr.length);

  //if no keywords are found
  if (arr.length === 0) {
    res
      .json({
        status: "success",
        message: "No result found",
        result: null,
      })
      .status(200);
  } else {
    var idArr = [];
    var sArray = [];

    try {
      await querySQl(res, arr, idArr, sArray);
    } catch (e) {
      res
        .json({
          status: "success",
          message: "No result found",
          result: null,
        })
        .status(200);
    }

    if (idArr.length !== 0) {
      getMongoData(idArr, sArray, res)
        .then((result, err) => {
          if (result) {
            if (result.length === 0) {
              res
                .json({
                  status: "success",
                  message: "No result found",
                  result: null,
                })
                .status(200);
            } else {
              res
                .json({
                  status: "success",
                  message: "result found",
                  result: result,
                })
                .status(200);
            }
          } else
            res
              .send({ status: "failed", message: "error occured" + err })
              .status(401);
        })
        .catch((e) => {
          res
            .send({ status: "failed", message: "error occured" + e })
            .status(401);
        });
    } else
      res
        .json({
          status: "success",
          message: "No result found",
          result: null,
        })
        .status(200);
  }
});

module.exports = router;
