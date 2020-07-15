const express = require("express");
const router = express.Router();
const mysql = require("mysql");

var natural = require("natural");
var tokenizer = new natural.WordTokenizer();

var corpus = [
  "pencil",
  "rubber",
  "red",
  "green",
  "blue",
  "sharppener",
  "dal",
  "tomato",
];
var spellcheck = new natural.Spellcheck(corpus);

//creating trie datastructure
var Trie = natural.Trie;
var trie = new Trie();
trie.addStrings(corpus);

router.route("/").post((req, res) => {
  var arr = startProcess(req.body.val);
  res.send(arr + "");
});

var startProcess = (str) => {
  //create token from the string
  var tokens = tokenCreate(str);
  var spellCorrected = spellnPrefix(tokens);

  return spellCorrected;
};

var tokenCreate = (str) => {
  var tokens = tokenizer.tokenize(str);

  return tokens;
};

var spellnPrefix = (arr) => {
  var res = [];

  for (var i = 0; i < arr.length; i++) {
    var t = spellcheck.getCorrections(arr[i], 1);

    if (t.length !== 0) res.push(t[0]);
    else {
      var tep = trie.findPrefix(arr[i]);
      console.log("tep", tep);
      if (tep[0] !== null) res.push(tep[0]);
    }
  }

  return res;
};

var nearest = (arr) => {
  var res = [];
  for (var i = 0; i < arr.length; i++) {
    for (var j = 0; j < corpus.length; j++) {
      if (
        natural.LevenshteinDistance(arr[i], corpus[i], { search: true })
          .distance < 3
      ) {
        res.push(arr[i]);
        console.log(corpus[i]);
      }
    }
  }
  return res;
};

module.exports = router;
