const router = require("express").Router();
const { ChatHistory } = require("../controllers/chatController");
const { AuthorizationMiddleware } = require("../middleware/authMiddleware");

router.route("/chat/:roomId").get(AuthorizationMiddleware, ChatHistory);


module.exports = router;
