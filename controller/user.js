const express = require("express");
const router = express.Router();
const userService = require("../service/userService");
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const websocket = require("../service/websocketService");
const requestIp = require('request-ip');
const statsService = require("../service/statsService");

router.get("/", hasUserRole(["ADMIN"]), function (req, res) {
  res.send(userService.getAllUsers());
});

router.get("/ranking", hasUserRole(["USER"]), function (req, res) {
  res.send(userService.getRanking());
});

router.get("/is-online", hasUserRole(["USER"]), function (req, res) {
  res.send({isOnline: websocket.isOnline(req.query.username)});
});

router.get("/home", hasUserRole(["USER"]), function (req, res) {
  const userId = Number(req.query["user_id"]);
  res.send({position: userService.getPlayersHome(userId)});
});

router.post("/mark-as-home", hasUserRole(["USER"]), function (req, res) {
  const position = req.body;
  schema.is(position, "Position");
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  res.send({
    success: true,
    castle: userService.markAsHome(position, user)
  });
});

router.get("/current", hasUserRole(["USER"]), function (req, res) {
  const user = userService.currentUser(req);
  if (user) {
    delete user.password;
    delete user.email_verified;
  }
  res.send(user);
});

router.post("/daily-reward", hasUserRole(["USER"]), function (req, res) {
  const user = userService.currentUser(req);
  userService.claimDailyReward(user);
  res.send({success: true});
});

router.get("/stats/activity-history", hasUserRole(["ADMIN"]), function (req, res) {
  res.send({success: true, result: statsService.getActiveUsers()});
});

router.post("/register", function (req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/User");

  const ip = requestIp.getClientIp(req);
  userService.checkIpForRegistration(ip);

  userService.create(requestBody, ip);
  res.send({
    success: true
  });
});

router.post("/authenticate", function(req, res, next) {
  const requestBody = req.body;
  schema.is(requestBody, "request/User");
  const ip = requestIp.getClientIp(req);
  const {token} = userService.authenticate(requestBody, ip);
  res.send({
    success: true,
    token
  });
});

module.exports = router;
