const express = require("express");
const router = express.Router();
const hasUserRole = require("../filter/hasUserRole");

router.post("/", hasUserRole(["USER"]), function (req) {
    console.error("[error] Got error from client: ", req.body);
});

module.exports = router;
