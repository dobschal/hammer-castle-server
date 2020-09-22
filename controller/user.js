const express = require("express");
const router = express.Router();
const userService = require("../service/user");
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const castleService = require("../service/castle");

router.get("/", hasUserRole(["ADMIN"]), function(req, res) {
  res.send(userService.getAllUsers());
});

router.get("/current", hasUserRole(["USER"]), function(req, res) {

  // FIXME: If the make hammer interval changes, the calculation is wrong here...

  const user = userService.currentUser(req);
  const castles = castleService.getAllOfUser(user);
  user.level = castles.reduce((prev, curr) => prev + curr.points, 0);
  user.hammerPerMinute = user.level * 6;
  delete user.password;
  delete user.email_verified;
  res.send(user);
});

router.post("/register", function(req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/User");
  userService.create(requestBody);
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
