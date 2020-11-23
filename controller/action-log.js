const express = require("express");
const router = express.Router();
const hasUserRole = require("../filter/hasUserRole");
const actionLogService = require("../service/actionLogService");
const schema = require("../lib/schema");
const userService = require("../service/userService");
const timer = require("../lib/timer");

router.get("/", hasUserRole(["USER"]), function (req, res) {
    timer.start("GET_ACTION_LOG");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send(actionLogService.getAllOfUser(user));
    timer.end("GET_ACTION_LOG", user.username);
});

module.exports = router;
