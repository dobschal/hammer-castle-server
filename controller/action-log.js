const express = require("express");
const router = express.Router();
const hasUserRole = require("../filter/hasUserRole");
const actionLogService = require("../service/actionLogService");
const schema = require("../lib/schema");
const userService = require("../service/userService");

router.get("/", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send(actionLogService.getAllOfUser(user));
});

module.exports = router;
