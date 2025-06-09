const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
    getStreak,
} = require("../controllers/streakController");

router.get("/streak", authenticate, getStreak);


module.exports = router;
