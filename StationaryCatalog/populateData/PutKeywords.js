var path = require("path");
var fs = require("fs");

const PutKeywords = (req, res, keyW) => {
  return new Promise((resolve, reject) => {
    var tempArr = [];

    var storePath =
      path.dirname("/Projects/StationaryCatalog/fileStore/TagMap.txt") +
      "/TagMap.txt";

    var readStream = fs.createReadStream(storePath, "utf8");
    var data = "";
    readStream
      .on("data", function (chunk) {
        data += chunk;
      })
      .on("end", function () {
        tempArr = data.split("\n");
        tempArr = tempArr.concat(keyW);
        console.log("array value", tempArr);
        insertUpdates(req, res, tempArr, resolve, reject);
      });
  });
};

var insertUpdates = (req, res, arr, resolve, reject) => {
  var set = new Set(arr);

  console.log("in set insertion ", set);
  var storePath =
    path.dirname("/Projects/StationaryCatalog/fileStore/TagMap.txt") +
    "/TagMap.txt";

  var file = fs.createWriteStream(storePath);
  file.on("error", function (err) {
    reject("errior is", err);
  });

  var index = 1;
  set.forEach((val) => {
    if (index === set.size) file.write(val);
    else file.write(val + "\n");

    index++;
  });

  file.end(() => {
    console.log("array updated");
    //res.send("array updated");
    resolve("updation done");
  });
};

module.exports = PutKeywords;
