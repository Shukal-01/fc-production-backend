const { Router } = require("express");
const { addOvertimeData, getOvertimeAll, updateMultipleOvertimeData } = require("../../controller/admin/staff/attendence/overtime.controller.js");

const overtimeRouter = Router();

overtimeRouter.post("/create", addOvertimeData);
overtimeRouter.get("/", getOvertimeAll);
overtimeRouter.put("/", updateMultipleOvertimeData);

module.exports = overtimeRouter;
