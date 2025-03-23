const express = require("express");
const router = express.Router();
const { getAvatar, saveAvatar, generateAvatar } = require("../controllers/avatarController");
const authenticate = require("../middleware/auth"); 

router.get("/avatar", authenticate, getAvatar);

router.post("/avatar", authenticate, saveAvatar);

router.post('/avatar/generate', authenticate, generateAvatar);

module.exports = router;
