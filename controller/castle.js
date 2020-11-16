const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const timer = require("../lib/timer");
const hasUserRole = require("../filter/hasUserRole");
const castleService = require("../service/castleService");
const userService = require("../service/userService");
const priceService = require("../service/priceService");

router.post("/create", hasUserRole(["USER"]), function (req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/CreateCastle");
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  res.send({
    success: true,
    castle: castleService.create(requestBody, user)
  });
});

router.delete("/", hasUserRole(["USER"]), function (req, res) {
  const requestBody = {
    x: Number(req.query.x),
    y: Number(req.query.y)
  };
  schema.is(requestBody, "request/DeleteCastle");
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  res.send({
    success: true,
    castle: castleService.deleteCastle(requestBody, user, true)
  });
});

router.post("/change-name", hasUserRole(["USER"]), function (req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/ChangeCastleName");
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  res.send({
    success: true,
    castle: castleService.changeName(requestBody, user)
  });
});

router.get("/", hasUserRole(["USER"]), function (req, res) {
  if ("fromX" in req.query && "fromY" in req.query && "toX" in req.query && "toY" in req.query) {
    timer.start("GET_CASTLES");
    res.send(castleService.getCastlesFromTo(
        Number(req.query.fromX),
        Number(req.query.fromY),
        Number(req.query.toX),
        Number(req.query.toY)));
    timer.end("GET_CASTLES");
  } else {
    res.send(castleService.getAll());
  }
});

router.get("/price", hasUserRole(["USER"]), function (req, res) {
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  const price = priceService.nextCastlePrice(user.id);
  res.send({price});
});

module.exports = router;
