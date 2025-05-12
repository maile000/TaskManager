const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createComment,
  getCommentsByTask,
  deleteComment,
  updateComment 
} = require("../controllers/commentController");

router.post("/teams/:teamId/tasks/:taskId/comments", authenticate, createComment);
router.get("/teams/:teamId/tasks/:taskId/comments", authenticate, getCommentsByTask);
router.put("/teams/:teamId/comments/:commentId", authenticate, updateComment);
router.delete("/teams/:teamId/comments/:commentId", authenticate, deleteComment);

module.exports = router;
