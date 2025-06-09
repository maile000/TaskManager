const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { getLevelProgress } = require("../controllers/levelController");

router.get("/level", authenticate, getLevelProgress);

module.exports = router;
