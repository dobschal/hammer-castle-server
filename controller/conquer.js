const express = require("express");
const router = express.Router();
const timer = require("../lib/timer");
const hasUserRole = require("../filter/hasUserRole");
const conquerService = require("../service/conquerService");

router.get("/", hasUserRole(["USER"]), function (req, res) {
    res.send(conquerService.getConquers());
});

module.exports = router;
