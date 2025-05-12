const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createTask,
  getTasksByTeam,
  getSingleTask,
  updateTask,
  updateTaskStatus,
  updateTaskPosition,
  getUserTasks
} = require("../controllers/taskController");

router.post("/teams/:teamId/tasks", authenticate, createTask);
router.get("/teams/:teamId/tasks", authenticate, getTasksByTeam);
router.get("/teams/:teamId/tasks/:taskId", authenticate, getSingleTask);
router.put("/teams/:teamId/tasks/:taskId", authenticate, updateTask);
router.put("/tasks/:taskId/status", authenticate, updateTaskStatus);
router.put("/tasks/:taskId/position", authenticate, updateTaskPosition);
router.get("/user/tasks", authenticate, getUserTasks);


module.exports = router;
