const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const beerService = require("../service/beerService.js");
const userService = require("../service/userService.js");

router.get("/stats", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send(beerService.beerStats(user.id));
});

module.exports = router;
