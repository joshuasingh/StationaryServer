var http = require("http");
var express = require("express");
var app = express();
var cors = require("cors");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql");
const engines = require("consolidate");
const { open, local } = require("./Security/sqlKeys.json");
const RetractKeywords = require("./populateData/RetractKeywords");
var ObjectId = require("mongodb").ObjectID;
const { AWSKey } = require("./Security/AWSProp");
var WSS = require("ws").Server;
app.use(cors());
app.engine("ejs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

const MongoClient = require("mongodb").MongoClient;

var AWS = require("aws-sdk");
var bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "10mb", extended: false }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

const root = require("./root/target");
const strProcess = require("./root/strProess");
const sqlConnect = require("./root/sqlConnect");
const InsertData = require("./populateData/InsertData");
const AddProduct = require("./createItem/AddProduct");
const SearchProd = require("./SearchModule/searchProd");
const GetSingleProduct = require("./SearchModule/GetSingleProduct");
const Account = require("./UserAccount/Account");
const verify = require("./UserAccount/verify");
const login = require("./UserAccount/Login");
const cartProcess = require("./Cart/CartProcess");
const cartUpdates = require("./Cart/CartUpdate");
const getRecommendation = require("./Recommendation/RecommendProvide");
const getSearchData = require("./SearchSuggestion/SuggestSearch");

var arr = require("./fileStore/UpdatedArray");
var RecommendCache = require("./Cache/RecommendationCache");
var myRecommends = require("./InitializeClass");
const { REFUSED } = require("dns");

app.use("/", root);
app.use("/string", strProcess);
app.use("/mysql", sqlConnect);
app.use("/populate", InsertData);
app.use("/product", AddProduct);
app.use("/search", SearchProd);
app.use("/getProduct", GetSingleProduct);
app.use("/account", Account);
app.use("/verify", verify);
app.use("/login", login);
app.use("/cart", cartProcess);
app.use("/cart/updates", cartUpdates);
app.use("/recommend", getRecommendation);
app.use("/suggest", getSearchData);

var serv = http.createServer(app);

const port = process.env.PORT || 8081;
serv.listen(port, () => {
  console.log("listening to", port);
});

console.log("aws key", AWSKey.AWSAccessKeyId, AWSKey.AWSSecretKey);

const setUpAws = () => {
  AWS.config.update({
    secretAccessKey: AWSKey.AWSSecretKey,
    accessKeyId: AWSKey.AWSAccessKeyId,
  });

  AWS.config.update({ region: "ap-southeast-1" });

  AWS.config.apiVersions = {
    cloudsearchdomain: "2013-01-01",
    // other service API versions
  };
};

setUpAws();

var initializeData = () => {
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
      data.split("\n").map((val, ind) => {
        arr[ind] = val;
      });

      console.log("updation done", arr);
    });
};

//initialize data to1 the array
initializeData();

//run react in production mode
if (process.env.NODE_ENV === "production") {
  app.use(express.static("../TempReact/my-app/build"));
}

app.post("/testretract", (req, res) => {
  var keys = req.body.keys;
  console.log("in retract keywordss");
  RetractKeywords(req, res, keys).then((result, err) => {
    if (result) {
      res.send("done without any problem");
    } else {
      res.send("problem in function");
    }
  });
});

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
    res.status(500).send(err);
  }
};

app.post("/testmongo", (req, res) => {
  console.log("in test mongo");
  var id = req.body.id;

  try {
    withDB(async (db) => {
      db.deleteOne({ _id: new ObjectId(id) }, function (err, result) {
        if (err) {
          res.send("unable to delete the value");
        } else {
          res.json(result);
        }
      });
    }, res);
  } catch (e) {
    console.log("in catch", e);
    res.send("unable to delete");
  }
});

///////////////side function not required in the main function
const withDB1 = async (operations, res) => {
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
    res.status(500).send(err);
  }
};

var inputSql = (arr) => {
  return new Promise((resolve, reject) => {
    const currDB = local;
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

    const queryStr =
      "insert into product values('" +
      arr._id +
      "','" +
      arr.title +
      "','" +
      arr.category +
      "','" +
      arr.description +
      "')";

    db.query(queryStr, (err, result) => {
      if (err) {
        console.log("error from rejetc", err);
        reject("error occured", err);
      } else {
        resolve("done");
      }
    });
  });
};

app.post("/transfer", async (req, res) => {
  try {
    withDB1((collection) => {
      collection.find({}).toArray(async (err, result) => {
        if (err) {
          res.send("error occured" + err);
        } else {
          for (var i = 0; i < result.length; i++) {
            await inputSql(result[i]);
          }

          res.json(result).status(200);
        }
      });
    }, res);
  } catch (e) {
    res.send("error" + e);
  }
});

app.post("/getSearch", (req, res) => {
  var query = req.body.query;

  console.log("query val", query);

  // var csd = new AWS.CloudSearchDomain({
  //   endpoint:
  //     "search-stationary-dock-01-dsrwmozolqkdeb3llzarisjuba.ap-southeast-1.cloudsearch.amazonaws.com",
  // });
  // var params = {
  //   query: query,
  // };

  // csd.search(params, function (err, data) {
  //   if (err) {
  //     console.log(err, err.stack); // an error occurred
  //   } else {
  //     res.json({ result: data }).status(200);
  //   }
  // });

  var spawn = require("child_process").spawn;
  var process = spawn("python", ["./movie_recommender.py", query]);

  process.stdout.on("data", function (data) {
    //let tempArr = data.toString().split("/");

    res.json({ result: data.toString() }).status(200);
  });
});

suggestionList = [
  "pencil",
  "rubber",
  "category",
  "sharpener",
  "art and craft",
  "action",
];

app.post("/getSuggestion", (req, res) => {
  var e = req.body.query;

  var temp = [];

  if (e.length !== 0) {
    var start = 0;

    if (e.lastIndexOf(",") !== e.lastIndexOf("/")) {
      start =
        e.lastIndexOf(",") > e.lastIndexOf("/")
          ? e.lastIndexOf(",")
          : e.lastIndexOf("/");
    }

    suggestionList.forEach((val) => {
      var s = e.slice(start === 0 ? start : start + 1, e.length);

      if (s.toLowerCase() === val.slice(0, s.length).toLowerCase())
        temp.push(val);
    });
  }

  res.json({ status: "success", result: temp }).status(200);
});
