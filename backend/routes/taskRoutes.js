const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createTask,
  deleteTask,
  getTasksByTeam,
  getSingleTask,
  updateTask,
  updateTaskStatus,
  updateTaskPosition,
  getUserTasks,
  getTeamProjects,
  postTeamProject,
  getTeamProgress,
  getUserTaskPoints,
  getWeeklyDeadlines
  
} = require("../controllers/taskController");

router.post("/teams/:teamId/tasks", authenticate, createTask);
router.delete("/teams/:teamId/tasks/:taskId", authenticate, deleteTask);
router.get("/teams/:teamId/tasks", authenticate, getTasksByTeam);
router.get("/teams/:teamId/tasks/:taskId", authenticate, getSingleTask);
router.put("/teams/:teamId/tasks/:taskId", authenticate, updateTask);
router.put("/tasks/:taskId/status", authenticate, updateTaskStatus);
router.put("/tasks/:taskId/position", authenticate, updateTaskPosition);
router.get("/user/tasks", authenticate, getUserTasks);
router.get("/teams/:teamId/projects", authenticate, getTeamProjects);
router.post("/teams/:teamId/projects", authenticate, postTeamProject);
router.get("/teams/:teamId/progress", authenticate, getTeamProgress);
router.get("/user/points", authenticate, getUserTaskPoints);
router.get('/user/tasks/deadlines/weekly', authenticate, getWeeklyDeadlines);

module.exports = router;
