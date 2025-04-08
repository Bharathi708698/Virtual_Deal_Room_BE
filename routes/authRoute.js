const router = require("express").Router();

const {
  RegisterController,
  LoginController,
  LogoutController,
  ProfileController,
} = require("../controllers/authController");
const { AuthenticationMiddleware, AuthorizationMiddleware } = require("../middleware/authMiddleware");

router.route("/register").post(AuthenticationMiddleware, RegisterController);
router.route("/login").post(AuthenticationMiddleware, LoginController);
router.route("/auth").get(AuthorizationMiddleware);
router.route("/profile").post(AuthorizationMiddleware, ProfileController);
router.route("/logout").post(AuthorizationMiddleware, LogoutController);

module.exports = router;
