const { Router } = require("express");
const rootRouter = Router();

const authorizationMiddleware = require("../middleware/auth");

const roleRouter = require("./admin/role.router.js");
const attendanceRouter = require("./admin/attendence.router.js");
const bgVerificationRouter = require("./admin/bgVerification.router.js");
const clientRouter = require("./admin/client.router.js");
const adminRouter = require("./admin/admin.router");
const department = require("./admin/department.router");
const notesRouter = require("./admin/notes.router");
const staffRouter = require("./admin/staff.router");
const salaryDetailsRouter = require("./admin/salaryDetails.router");
const deductionsRouter = require("./admin/deductions.router");
const customDetailsRouter = require("./admin/customDetails.router");
const policyRouter = require("./admin/policy.router");
const pastEmploymentRouter = require("./admin/pastEmployment.router");
const shiftRouter = require("./admin/shift.router");
const punchRouter = require("./admin/punch.router");
const bankDetailsRouter = require("./admin/bankDetails.router.js");
const projectRouter = require("./admin/project.router");
const projectFilesRouter = require("./admin/projectFiles.router");
const leaveBalanceRouter = require("./admin/leaveBalance.router");
const leavePolicyRouter = require("./admin/leavePolicy.router");
const leaveRequestRouter = require("./admin/leaveRequest.router");
const taskRouter = require("./admin/task.router");
const discussionRouter = require("./admin/discussions.router");
const upiRouter = require("./admin/upi.router.js");
const breakRouter = require("./admin/break.router.js");
const projectStatus = require("./admin/projectStatus.router");
const earningsData = require("./admin/earnings.router");
const projectPriority = require("./admin/projectPriority.router");
const loginRouter = require("./admin/staffLogin.router.js");
const workRouter = require("./admin/workEntry.router.js");
const ChatRouter = require("./chat.router.js");
const MessageRouter = require("./message.router.js");
const FineRouter = require("./admin/fine.router.js");
const overtime = require("./admin/overtime.router.js");
const branchRouter = require("./admin/branch.router.js");
const userRouter = require("./user.router.js");
const IncentivesRouter = require("./admin/incentives.router.js");
const ReimbursementsRouter = require("./admin/reimbursements.router.js");
const payRollRouter = require("./payroll.router.js");
const paymentRouter = require("./admin/payment.router.js");
const leadRouter = require("./admin/lead.router.js");
const CommentRouter = require("./comment.router.js");
const activityRouter = require("./admin/activity.router.js");
const EvenetRouter = require("./admin/event.router.js");

rootRouter.use("/role", roleRouter);
rootRouter.use("/user", userRouter);
rootRouter.use("/attendance", attendanceRouter);
rootRouter.use("/bank-details", bankDetailsRouter);
rootRouter.use("/bg-verification", bgVerificationRouter);
rootRouter.use("/client", clientRouter);
rootRouter.use("/admin", adminRouter);
rootRouter.use("/department", department);
rootRouter.use("/staff", staffRouter);
rootRouter.use("/project-status", projectStatus);
rootRouter.use("/project-Priority", projectPriority);
rootRouter.use("/earnings", earningsData);
// rootRouter.use("/deduction", deductionsRouter);
rootRouter.use("/salary", salaryDetailsRouter);
rootRouter.use("/deduction", deductionsRouter);
rootRouter.use("/custom-details", customDetailsRouter);
rootRouter.use("/policy", policyRouter);
rootRouter.use("/shift", shiftRouter);
rootRouter.use("/punch", punchRouter);
rootRouter.use("/project", projectRouter);
rootRouter.use("/project-files", projectFilesRouter);
rootRouter.use("/leave-balance", leaveBalanceRouter);
rootRouter.use("/leave-policy", leavePolicyRouter);
rootRouter.use("/leave-request", leaveRequestRouter);
rootRouter.use("/task", taskRouter);
rootRouter.use("/discussions", discussionRouter);
rootRouter.use("/upi-details", upiRouter);
rootRouter.use("/break", breakRouter);
rootRouter.use("/staff-login", loginRouter);
rootRouter.use("/work-entry", workRouter);
rootRouter.use("/past-employment", pastEmploymentRouter);
rootRouter.use("/chat", ChatRouter);
rootRouter.use("/message", MessageRouter);
rootRouter.use("/branch", branchRouter);

rootRouter.use("/fine", FineRouter);
rootRouter.use("/overtime", overtime);
rootRouter.use("/notes", notesRouter);
rootRouter.use("/payment", authorizationMiddleware, paymentRouter);
rootRouter.use("/incentives", authorizationMiddleware, IncentivesRouter);
rootRouter.use(
  "/reimbursements",
  authorizationMiddleware,
  ReimbursementsRouter
);

rootRouter.use("/payroll", authorizationMiddleware, payRollRouter);

rootRouter.use("/lead", leadRouter);

rootRouter.use("/comment", CommentRouter);

rootRouter.use("/activity", activityRouter);

rootRouter.use("/event", EvenetRouter);

module.exports = rootRouter;
