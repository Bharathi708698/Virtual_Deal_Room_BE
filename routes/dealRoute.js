const router = require("express").Router();
const {
  DealCreationController,
  GetDealsController,
  GetSellerController,
  getAssignedDeals,
} = require("../controllers/dealController");
const { AuthorizationMiddleware } = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // unique file name
  },
});

const upload = multer({ storage });

router
  .route("/deal")
  .post(AuthorizationMiddleware, upload.single("file"), DealCreationController);
router.route("/deal").get(AuthorizationMiddleware, GetDealsController);
router.route("/seller").get(AuthorizationMiddleware, GetSellerController);
router.route("/deal/assigned").get(AuthorizationMiddleware, getAssignedDeals);

module.exports = router;
