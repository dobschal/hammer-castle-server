const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const forumService = require("../service/forumService");
const userService = require("../service/userService");

router.post("/category", hasUserRole(["ADMIN"]), function (req, res) {
    const requestBody = req.body;
    if ("id" in requestBody) {
        schema.is(requestBody, "request/UpdateCategory");
        res.send({
            success: true,
            category: forumService.updateCategory(requestBody)
        });
    } else {
        schema.is(requestBody, "request/CreateCategory");
        res.send({
            success: true,
            category: forumService.createCategory(requestBody)
        });
    }
});

router.get("/category", hasUserRole(["USER"]), function (req, res) {
    if ("id" in req.query) {
        res.send(forumService.getCategoryById(Number(req.query.id)));
    } else {
        res.send(forumService.getAllCategories());
    }
});

router.delete("/category", hasUserRole(["ADMIN"]), function (req, res) {
    if ("id" in req.query) {
        res.send(forumService.deleteCategory(Number(req.query.id)));
    } else {
        throw new Error("Missing id...");
    }
});

router.post("/entry", hasUserRole(["USER"]), function (req, res) {
    const requestBody = req.body;
    schema.is(requestBody, "request/CreateForumEntry");
    const user = userService.currentUser(req);
    schema.is(user, "entity/User");
    res.send({
        success: true,
        entry: forumService.createEntry(requestBody, user.id)
    });
});

router.get("/entry", hasUserRole(["USER"]), function (req, res) {
    if ("category_id" in req.query) {
        res.send(forumService.getEntriesByCategoryId(Number(req.query.category_id)));
    } else if ("id" in req.query) {
        res.send(forumService.getEntryById(Number(req.query.id)));
    } else {
        res.send(forumService.getAllEntries());
    }
});

module.exports = router;
