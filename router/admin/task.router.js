const express = require("express");
const taskRouter = express.Router();
const {
  uploadAndSaveToCloudinary,
  uploadMultipleAndSaveToCloudinary,
} = require("../../middleware/multer.middleware.js");
const {
  createTaskStatus,
  getAllTaskStatus,
  deleteTaskStatus,
  createTaskPriority,
  deleteTaskDetailInBulk,
  searchTaskPriorityByName,
  getAllTaskPriority,
  deleteTaskPriority,
  createTaskDetail,
  getAllTaskDetail,
  deleteTaskDetail,
  updateTaskDetail,
  getTaskDetailById,
  updateTaskStatus,
  updateTaskPriority,
  searchTaskDetailByName,
  searchTaskStatusByName,
  getAllTaskCount,
} = require("../../controller/admin/task.controller");
const authorizationMiddleware = require("../../middleware/auth.js");


taskRouter.get("/count", authorizationMiddleware, getAllTaskCount);
taskRouter.post("/status", authorizationMiddleware, createTaskStatus);
taskRouter.get("/status", authorizationMiddleware, getAllTaskStatus);
taskRouter.put("/status/:id", authorizationMiddleware, updateTaskStatus);
taskRouter.delete("/status/:id", authorizationMiddleware, deleteTaskStatus);

taskRouter.post("/priority", authorizationMiddleware, createTaskPriority);
taskRouter.get("/priority", authorizationMiddleware, getAllTaskPriority);
taskRouter.put("/priority/:id", authorizationMiddleware, updateTaskPriority);
taskRouter.delete("/priority/:id", authorizationMiddleware, deleteTaskPriority);

taskRouter.post(
  "/detail",
  authorizationMiddleware,
  uploadMultipleAndSaveToCloudinary("attachFile"),
  createTaskDetail
);
taskRouter.delete(
  "/detail/bulk",
  authorizationMiddleware,
  deleteTaskDetailInBulk
);
taskRouter.get("/detail", authorizationMiddleware, getAllTaskDetail);
taskRouter.delete("/detail/:id", authorizationMiddleware, deleteTaskDetail);
taskRouter.get("/detailById/:id", authorizationMiddleware, getTaskDetailById);

taskRouter.get(
  "/searchPriority?",
  authorizationMiddleware,
  searchTaskPriorityByName
);
taskRouter.get(
  "/searchDetail",
  authorizationMiddleware,
  searchTaskDetailByName
);
taskRouter.get(
  "/searchStatus",
  authorizationMiddleware,
  searchTaskStatusByName
);

taskRouter.put(
  "/detail/:id",
  authorizationMiddleware,
  uploadMultipleAndSaveToCloudinary("attachFile"),
  updateTaskDetail
);

module.exports = taskRouter;
