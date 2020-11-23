const express = require("express");
const router = express.Router();
const { version } = require("../package.json");

router.get("/version", function(req, res, next) {
  res.send({ version, hey: "yeah! OMG!" });
});

module.exports = router;
