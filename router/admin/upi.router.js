const express = require("express");
const {
  createOrUpdateUpiDetails,
  getUpiDetailsByStaffId,
  deleteUpiDetailsByStaffId,
} = require("../../controller/admin/staff/upi.controller");

const upiRouter = express.Router();

upiRouter.post("/", createOrUpdateUpiDetails);

upiRouter.get("/:staffId", getUpiDetailsByStaffId);

upiRouter.delete("/:staffId", deleteUpiDetailsByStaffId);

module.exports = upiRouter;
