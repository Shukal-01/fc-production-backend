const express = require("express");
const adminRouter = express.Router();
const authenticateUser = require("../../middleware/auth");
const {
  uploadAndSaveToCloudinary,
} = require("../../middleware/multer.middleware.js");
const {
  adminSignup,
  verifyOTP,
  adminLogin,
  updateAdmin,
  getAllAdmins,
  signupWithGoogle,
  requestPasswordReset,
  updateAdminPassword,
} = require("../../controller/admin/admin.controller");

adminRouter.post("/", uploadAndSaveToCloudinary("companyLogo"), adminSignup);
adminRouter.put("/verify-otp", verifyOTP);
adminRouter.post("/login", adminLogin);
adminRouter.put("/update", updateAdmin);
adminRouter.get("/", getAllAdmins);
adminRouter.post("/signup-with-google", signupWithGoogle);
adminRouter.post("/reset", requestPasswordReset);
adminRouter.patch("/reset-password", updateAdminPassword);

module.exports = adminRouter;
