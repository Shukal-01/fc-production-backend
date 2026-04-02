const express = require("express");
const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  searchStaffByName,
  searchStaffByStatus,
  deleteStaffInBulk,
  applyFineAndOvertime,
  updateStatus,
  getStaffByDateOfBirth,
  getStaffCount,
} = require("../../controller/admin/staff/staff.controller");
const authorizationMiddleware = require("../../middleware/auth");

const staffRouter = express.Router();

staffRouter.get("/count", authorizationMiddleware, getStaffCount);

staffRouter.post("/", authorizationMiddleware, createStaff);
staffRouter.get("/birthday", authorizationMiddleware, getStaffByDateOfBirth);

staffRouter.get("/search", authorizationMiddleware, searchStaffByName);
staffRouter.get("/search-status", authorizationMiddleware, searchStaffByStatus);

staffRouter.get("/", authorizationMiddleware, getAllStaff);

staffRouter.get("/one", authorizationMiddleware, getStaffById);
staffRouter.put("/apply", authorizationMiddleware, applyFineAndOvertime);

staffRouter.put("/:id", authorizationMiddleware, updateStaff);
staffRouter.delete("/bulk", authorizationMiddleware, deleteStaffInBulk);

staffRouter.delete("/:id", authorizationMiddleware, deleteStaff);

staffRouter.patch("/status/:id", authorizationMiddleware, updateStatus);

module.exports = staffRouter;
