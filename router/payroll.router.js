const { Router } = require("express");
const {
  fetchAllStaffPayroll,
  finalizePayroll,
  multiStaffFinalizePayroll,
} = require("../controller/admin/payroll.controller.js");

const payRollRouter = Router();

payRollRouter.get("/allStaff/:month/:year", fetchAllStaffPayroll);
payRollRouter.patch("/finalize/:id", finalizePayroll);
payRollRouter.patch("/allStaff/finalize", multiStaffFinalizePayroll);

module.exports = payRollRouter;
