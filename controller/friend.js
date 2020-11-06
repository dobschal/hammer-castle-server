const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const friendService = require("../service/friendService");
const userService = require("../service/userService");

router.post("/find-user", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/FindUser");
    res.send({
        success: true,
        users: friendService.findUser(requestBody.query)
    });
});

router.post("/add", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/AddFriend");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        friend: friendService.addFriend(requestBody.username, user)
    });
});

router.get("/list", hasUserRole(["USER"]), function (req, res) {
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        friends: friendService.getFriendsList(user)
    });
});

module.exports = router;
