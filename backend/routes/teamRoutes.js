const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createTeam,
  getUserTeams,
  getTeamDetails,
  getInviteCode,
  getTeamMembers,
  changeMemberRole,
  updateColumnOrder,
  joinTeam
} = require("../controllers/teamController");

router.post("/create-team", authenticate, createTeam);
router.get("/teams", authenticate, getUserTeams);
router.get("/teams/:teamId", authenticate, getTeamDetails);
router.get("/teams/:teamId/invite-code", authenticate, getInviteCode);
router.get("/teams/:teamId/members", authenticate, getTeamMembers);
router.put("/teams/:teamId/members/:userId/role", authenticate, changeMemberRole);
router.put("/teams/:teamId/column-order", authenticate, updateColumnOrder);
router.post("/join-team", authenticate, joinTeam);


module.exports = router;
