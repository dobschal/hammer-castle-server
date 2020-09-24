const express = require("express");
const router = express.Router();
const schema = require("../lib/schema");
const hasUserRole = require("../filter/hasUserRole");
const castleService = require("../service/castle");
const userService = require("../service/user");

module.exports = router;
