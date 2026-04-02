const express = require("express");
const punchRouter = express.Router();
const {
  uploadAndSaveToCloudinary,
} = require("../../middleware/multer.middleware.js");
const {
  createPunchIn,
  getAllPunchIn,
  createPunchOut,
  getAllPunchOut,
  getPunchRecords,
  getPunchRecordById,
  updatePunchRecordApproveStatus,
} = require("../../controller/admin/punch.controller.js");
const authorizationMiddleware = require("../../middleware/auth.js");

punchRouter.post(
  "/in",
  uploadAndSaveToCloudinary("photoUrl"),
  authorizationMiddleware,
  createPunchIn
);
punchRouter.get("/in", getAllPunchIn);
punchRouter.post(
  "/out",
  uploadAndSaveToCloudinary("photoUrl"),
  authorizationMiddleware,
  createPunchOut
);
punchRouter.get("/out", getAllPunchOut);
punchRouter.get("/records", getPunchRecords);
punchRouter.get("/records/:id", getPunchRecordById);
punchRouter.put("/records/approve", updatePunchRecordApproveStatus);
module.exports = punchRouter;
