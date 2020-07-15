const express = require("express");
const router = express.Router();

router
  .route("/main")
  .get((req, res) => {
    res.send("hello from get");
  })
  .post((req, res) => {
    res.send("hello from post");
  });

module.exports = router;
