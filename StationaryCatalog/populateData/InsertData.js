var express = require("express");
var router = express.Router();
const fs = require("fs");
const path = require("path");

const route1 = router.route("/");

//insert data into file

route1.get((req, res) => {
  var arr = ["dfsdf", "sdfsdfsd"];

  var storePath =
    path.dirname("/Projects/StationaryCatalog/fileStore/TagMap.txt") +
    "/TagMap.txt";

  var readStream = fs.createReadStream(storePath, "utf8");
  var arr = [];
  var data = "";
  readStream
    .on("data", function (chunk) {
      data += chunk;
    })
    .on("end", function () {
      arr = data.split(",");
      console.log(data, arr);
    });

  res.send("done");
});

module.exports = router;
