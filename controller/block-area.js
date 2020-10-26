const express = require("express");
const router = express.Router();
const hasUserRole = require("../filter/hasUserRole");
const blockAreaService = require("../service/blockAreaService");

router.get("/", hasUserRole(["USER"]), function (req, res) {
    res.send(blockAreaService.getAll());
});

module.exports = router;
