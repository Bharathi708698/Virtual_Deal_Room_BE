const router = require("express").Router();
const { CreateOrderController, VerifyPaymentController, TransactionController } = require("../controllers/razorpayController");
const { AuthorizationMiddleware } = require("../middleware/authMiddleware");

router.route("/payment/init").post(AuthorizationMiddleware, CreateOrderController);
router.route("/payment/verify").post(AuthorizationMiddleware, VerifyPaymentController);
router.route("/transaction").get(AuthorizationMiddleware, TransactionController);


module.exports = router;