const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const castleService = require("../service/castle");
const userService = require("../service/user");

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

let castleFetchTimes = [];

setInterval(() => {
  if (castleFetchTimes.length) {
    const averageFetchTime = Math.floor(castleFetchTimes.reduce((prev, curr) => prev + curr, 0) / castleFetchTimes.length);
    const min = Math.min.apply(null, castleFetchTimes);
    const max = Math.max.apply(null, castleFetchTimes);
    console.log("[castle] Fetch castle times (average/max/min/count) in ms: ", averageFetchTime, max, min, castleFetchTimes.length);
  }
  castleFetchTimes = [];
}, 10000);

router.get("/", hasUserRole(["USER"]), function (req, res) {
  if ("fromX" in req.query && "fromY" in req.query && "toX" in req.query && "toY" in req.query) {
    const t1 = Date.now();
    console.log("[castle] Get Castles in area: ", req.query);
    res.send(castleService.getCastlesFromTo(
        Number(req.query.fromX),
        Number(req.query.fromY),
        Number(req.query.toX),
        Number(req.query.toY)));
    castleFetchTimes.push(Date.now() - t1);
  } else {
    res.send(castleService.getAll());
  }
});

router.get("/price", hasUserRole(["USER"]), function (req, res) {
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  const price = castleService.getNextCastlePrice(user);
  res.send({price});
});

router.get("/conquers", hasUserRole(["USER"]), function (req, res) {
  res.send(castleService.getConquers());
});

module.exports = router;
