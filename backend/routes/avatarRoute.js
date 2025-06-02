const express = require("express");
const router = express.Router();
const { getAvatar, saveAvatar, generateAvatar, getAvatarByUserId } = require("../controllers/avatarController");
const authenticate = require("../middleware/auth"); 

router.get("/avatar", authenticate, getAvatar);
router.post("/avatar", authenticate, saveAvatar);
router.post('/avatar/generate', authenticate, generateAvatar);
router.get("/avatar/:userId", authenticate, getAvatarByUserId);

module.exports = router;
