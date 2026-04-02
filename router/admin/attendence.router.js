const { Router } = require("express");
const {
  fetchAllStaftAutomationAttendence,
  addAndUpdateAutomationRuleForStaffs,
} = require("../../controller/admin/staff/attendence/automationRules.controller.js");
const {
  fetchAttendenceModeForAllStaff,
  addAndUpdateAttendenceModeForStaffs,
} = require("../../controller/admin/staff/attendence/mode.controller.js");

const {
  allStaffAttendanceByDate,
  updatePunchRecordStatus,
  getSingleStaffAttendance,
  getBreakRecordByStaffId,
  getMonthlyAttendance,
} = require("../../controller/admin/staff/attendence/attendance.controller.js");
const authorizationMiddleware = require("../../middleware/auth.js");

const attendanceRouter = Router();

attendanceRouter.get("/automation", fetchAllStaftAutomationAttendence);
attendanceRouter.put("/automation", addAndUpdateAutomationRuleForStaffs);
attendanceRouter.get("/mode", fetchAttendenceModeForAllStaff);
attendanceRouter.put("/mode", addAndUpdateAttendenceModeForStaffs);

// attendance overview routes here :-

attendanceRouter.patch(
  "/status/:id",
  authorizationMiddleware,
  updatePunchRecordStatus
);

attendanceRouter.get(
  "/summary",
  authorizationMiddleware,
  allStaffAttendanceByDate
);

attendanceRouter.get("/single/:id", getSingleStaffAttendance);

attendanceRouter.get(
  "/monthly/:id",
  authorizationMiddleware,
  getMonthlyAttendance
);

attendanceRouter.get("/break-record/:staffId", getBreakRecordByStaffId);

module.exports = attendanceRouter;
