const express = require("express");
const leaveRequestRouter = express.Router();
const {
  getAllLeaveRequests,
  getLeaveRequestsByStaffId,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
} = require("../../controller/admin/staff/leaveRequest.controller");

leaveRequestRouter.get("/", getAllLeaveRequests);
leaveRequestRouter.get("/:id", getLeaveRequestsByStaffId);
leaveRequestRouter.post("/:id", createLeaveRequest);
leaveRequestRouter.put("/:id", updateLeaveRequest);
leaveRequestRouter.delete("/:id", deleteLeaveRequest);

module.exports = leaveRequestRouter;
