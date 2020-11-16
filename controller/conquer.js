const express = require("express");
const router = express.Router();
const timer = require("../lib/timer");
const hasUserRole = require("../filter/hasUserRole");
const conquerService = require("../service/conquerService");

router.get("/", hasUserRole(["USER"]), function (req, res) {
    timer.start("GET_CONQUERS");
    res.send(conquerService.getConquers());
    timer.end("GET_CONQUERS");
});

module.exports = router;
