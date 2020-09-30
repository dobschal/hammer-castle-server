const express = require("express");
const router = express.Router();
const userService = require("../service/user");
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const websocket = require("../service/websocket");

router.get("/", hasUserRole(["ADMIN"]), function (req, res) {
  res.send(userService.getAllUsers());
});

router.get("/ranking", hasUserRole(["USER"]), function (req, res) {
  res.send(userService.getRanking());
});

router.get("/is-online", hasUserRole(["USER"]), function (req, res) {
  res.send({isOnline: websocket.isOnline(req.query.username)});
});

router.get("/current", hasUserRole(["USER"]), function (req, res) {
  const user = userService.currentUser(req);
  delete user.password;
  delete user.email_verified;
  res.send(user);
});

router.post("/register", function (req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/User");

  const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
  userService.checkIpForRegistration(ip);

  userService.create(requestBody, ip);
  res.send({
    success: true
  });
});

router.post("/authenticate", function(req, res, next) {
  const requestBody = req.body;
  schema.is(requestBody, "request/User");
  const {token} = userService.authenticate(requestBody);
  res.send({
    success: true,
    token
  });
});

module.exports = router;
