const express = require("express");
const router = express.Router();
const userService = require("../service/user");
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");

router.get("/", hasUserRole(["ADMIN"]), function(req, res) {
  res.send(userService.getAllUsers());
});

router.post("/register", function(req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/User");
  userService.create(requestBody);
  res.send({
    success: true
  });
});

router.post("/authenticate", function(req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/User");
  const { token } = userService.authenticate(requestBody);
  res.send({
    success: true,
    token
  });
});

module.exports = router;
