const express = require("express");
const router = express.Router();
const withDB1 = require("../MongoConnect/MongoConn");
const { resolve } = require("path");
const { MediaPackage } = require("aws-sdk");
const ObjectID = require("mongodb").ObjectID;
const route1 = router.route("/product/:id");
var myRecommends = require("../InitializeClass");

//get recommendation from pyton scripts
let getRecommendedIDs = (res, query) => {
  return new Promise((resolve, reject) => {
    var spawn = require("child_process").spawn;
    var process = spawn("python", [
      "./PythonScripts/movie_recommender.py",
      query,
    ]);

    process.stdout.on("data", function (data) {
      let tempArr = data.toString().split("/");
      tempArr.pop();
      resolve(tempArr);
    });
  });
};

//get values from mongo
let getRecommendedProduct = (ids, res) => {
  return new Promise((resolve, reject) => {
    withDB1(
      async (coll) => {
        coll.find({ _id: { $in: ids } }).toArray((err, result) => {
          if (err) {
            console.log("error occured in fetching product", err);
            reject(err);
          } else {
            console.log("got result from mongo");
            resolve(result);
          }
        });
      },
      res,
      "Catalog"
    );
  });
};

// the main routes
route1.get(async (req, res) => {
  let query = req.params.id;
  console.log("in product ", query);

  let cacheResult = myRecommends.getVal(query);

  if (cacheResult !== null) {
    res.json({ status: "success", result: cacheResult }).status(200);
    return;
  }

  getRecommendedIDs(res, query)
    .then((result, err) => {
      if (err) {
        res.json({ status: "failed", error: err }).status(401);
      } else {
        //change string array to id array
        let ids_Arr = [];
        var ids_Map = new Map();
        result.map((val) => {
          //removing the self id from the array
          if (val !== query) {
            ids_Arr.push(new ObjectID(val));

            ids_Map.set(val, null);
          }
        });

        getRecommendedProduct(ids_Arr, res)
          .then((result, err1) => {
            if (err1) {
              res.json({ status: "failed", error: err1 }).status(401);
            } else {
              result.map((val) => {
                ids_Map.set(val._id.toString(), val);
              });

              let lastResult = Array.from(ids_Map.values());

              //set The values in cache
              myRecommends.setVal(query, lastResult);

              res
                .json({
                  status: "success",
                  result: lastResult,
                })
                .status(200);
            }
          })
          .catch((error) => {
            console.log("error in getting product from mongo", error);
            res.json({ status: "failed", error: error }).status(401);
          });
      }
    })
    .catch((e) => {
      console.log("error in failed", e);
      res.json({ status: "failed", error: e }).status(401);
    });
});

module.exports = router;
