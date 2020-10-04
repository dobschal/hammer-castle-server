const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const forumService = require("../service/forumService");

router.post("/category", hasUserRole(["ADMIN"]), function (req, res) {
    const requestBody = req.body;
    if ("id" in requestBody) {
        schema.is(requestBody, "request/UpdateCategory");
        res.send({
            success: true,
            catapult: forumService.updateCategory(requestBody)
        });
    } else {
        schema.is(requestBody, "request/CreateCategory");
        res.send({
            success: true,
            catapult: forumService.createCategory(requestBody)
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

module.exports = router;
