const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createProject,
  updateProject,
  deleteProject
} = require("../controllers/projectController");

router.post("/teams/:teamId/projects", authenticate, createProject);
router.put("/teams/:teamId/projects/:projectId", authenticate, updateProject);
router.delete("/teams/:teamId/projects/:projectId", authenticate, deleteProject);

module.exports = router;