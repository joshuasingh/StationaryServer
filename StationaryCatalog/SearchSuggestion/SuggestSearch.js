var express = require("express");
const { LexModelBuildingService } = require("aws-sdk");
var router = express.Router();
const { open, local } = require("../Security/sqlKeys.json");
const mysql = require("mysql");

let route1 = router.route("/search/:query");

const getSearchData = (query) => {
  return new Promise((resolve, reject) => {
    let currDB = local;

    var db = mysql.createConnection({
      host: currDB.host,
      user: currDB.Username,
      password: currDB.Password,
      database: currDB.DBname,
    });

    let dbQuery =
      "SELECT " +
      "P.title " +
      "FROM " +
      "PRODUCT P " +
      "WHERE " +
      "title like '" +
      query +
      "%' " +
      "UNION " +
      "select " +
      "P.category  " +
      "from " +
      "product P " +
      "where " +
      "category like '" +
      query +
      "%'";

    db.connect((err) => {
      if (err) {
        reject("error occured", err);
      }
      console.log("mysql server connected");
    });

    db.query(dbQuery, (err, sugg) => {
      if (err) {
        console.log("error from rejetc", err);
        reject("error occured", err);
      } else {
        console.log("got search result", sugg);
        let arr = [];
        sugg.map((val) => {
          arr.push(val.title);
        });

        resolve(arr);
      }
    });
  });
};

////////////////calling route
route1.get((req, res) => {
  let query = req.params.query;
  console.log("got in ", query);

  getSearchData(query)
    .then((result, err) => {
      if (err) {
        console.log("error occured", err.toString());
        res.json({ status: "failed", error: err.toString() }).status(401);
      } else {
        res.json({ status: "success", result: result }).status(200);
      }
    })
    .catch((e) => {
      console.log("error occured", e.toString());
      res.json({ status: "failed", error: e.toString() }).status(401);
    });
});

module.exports = router;
