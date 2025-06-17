const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { getLevelProgress, getTeamLevels } = require("../controllers/levelController");

router.get("/level", authenticate, getLevelProgress);
router.get("/teams/:teamId/levels", authenticate, getTeamLevels);

module.exports = router;
