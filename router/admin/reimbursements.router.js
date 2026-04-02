const express = require("express");
const ReimbursementsRouter = express.Router();
const reimbursementController = require("../../controller/admin/reimbursement.controller");

// Routes
ReimbursementsRouter.get("/", reimbursementController.getAllReimbursements);
ReimbursementsRouter.get("/:id", reimbursementController.getReimbursementById);
ReimbursementsRouter.post("/", reimbursementController.createReimbursement);
ReimbursementsRouter.put("/:id", reimbursementController.updateReimbursement);
ReimbursementsRouter.delete(
  "/:id",
  reimbursementController.deleteReimbursement
);

module.exports = ReimbursementsRouter;
