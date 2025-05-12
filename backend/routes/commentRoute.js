const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createComment,
  getCommentsByTask,
  deleteComment,
  updateComment 
} = require("../controllers/commentController");

router.post("/tasks/:taskId/comments", authenticate, createComment);
router.get("/tasks/:taskId/comments", authenticate, getCommentsByTask);
router.put("/comments/:commentId", authenticate, updateComment);
router.delete("/comments/:commentId", authenticate, deleteComment);

module.exports = router;
