const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const castleService = require("../service/castle");
const userService = require("../service/user");

router.post("/create", hasUserRole(["USER"]), function(req, res) {
  const requestBody = req.body;
  schema.is(requestBody, "request/CastlePosition");
  const user = userService.currentUser(req);
  schema.is(user, "entity/User");
  castleService.create(requestBody, user);
  res.send({
    success: true
  });
});

router.get("/", hasUserRole(["USER"]), function(req, res) {
  res.send(castleService.getAll(true));
});

module.exports = router;
