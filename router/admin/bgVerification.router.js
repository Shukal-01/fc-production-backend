const { Router } = require("express");
const {
  fetchAllStaffBgVerification,
  updateStaffBgVerifcation,
} = require("../../controller/admin/staff/bgVerification.controller.js");
const { uploadAndSaveToCloudinary } = require("../../middleware/multer.middleware.js");

const bgVerificationRouter = Router();
bgVerificationRouter.get("/:id/verify", fetchAllStaffBgVerification);
bgVerificationRouter.put(
  "/:id/verify/:verificationType",
  uploadAndSaveToCloudinary("verificationFile"),
  updateStaffBgVerifcation
);

module.exports = bgVerificationRouter;
