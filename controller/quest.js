const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const questService = require("../service/questService");
const userService = require("../service/userService");

router.get("/next", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send(questService.getNextQuests(user.id));
});

router.post("/read", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/ReadQuest");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({success: questService.readQuest(requestBody.questId, user)});
});

module.exports = router;
