const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const castleService = require("../service/castle");
const userService = require("../service/user");

router.post("/create", hasUserRole(["USER"]), function(req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/CreateCastle");
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  res.send({
    success: true,
    castle: castleService.create(requestBody, user)
  });
});

router.post("/change-name", hasUserRole(["USER"]), function(req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/ChangeCastleName");
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  res.send({
    success: true,
    castle: castleService.changeName(requestBody, user)
  });
});

router.get("/", hasUserRole(["USER"]), function(req, res) {
  if ("fromX" in req.query && "fromY" in req.query && "toX" in req.query && "toY" in req.query) {
    console.log("[castle] Get Castles in area: ", req.query);
    res.send(castleService.getCastlesFromTo(
        Number(req.query.fromX),
        Number(req.query.fromY),
        Number(req.query.toX),
        Number(req.query.toY)));
  } else {
    res.send(castleService.getAll());
  }
});

module.exports = router;
