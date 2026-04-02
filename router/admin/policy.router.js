const express = require("express");
const policyRouter = express.Router();
const { createEarlyLeavePolicy, createLateComingPolicy, createOvertimePolicy, updateOvertimePoicyByStaffId, updateLateComingPolicyByStaffId, getAllEarlyLeavePolicy, updateEarlyLeavePolicyByStaffId, getAllLateComingPolicy, getAllOvertimePolicy, createBulkLateComingPolicies, createBulkOvertimePayPolicies, createBulkEarlyLeavePolicies } = require("../../controller/admin/policy.controller");

policyRouter.post("/early", createEarlyLeavePolicy);
policyRouter.post("/late", createLateComingPolicy);
policyRouter.post("/overtime", createOvertimePolicy);
policyRouter.post("/early/bulk", createBulkEarlyLeavePolicies);
policyRouter.post("/late/bulk", createBulkLateComingPolicies);
policyRouter.post("/overtime/bulk", createBulkOvertimePayPolicies);
policyRouter.get("/early", getAllEarlyLeavePolicy);
policyRouter.get("/late", getAllLateComingPolicy);
policyRouter.get("/overtime", getAllOvertimePolicy);
policyRouter.put("/early/:staffId", updateEarlyLeavePolicyByStaffId);
policyRouter.put("/late/:staffId", updateLateComingPolicyByStaffId);
policyRouter.put("/overtime/:staffId", updateOvertimePoicyByStaffId);

module.exports = policyRouter;
