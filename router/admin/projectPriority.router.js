const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const projectPriorityRouter = express.Router();
const projectPriorityController = require("../../controller/admin/project/projectPriority.controller.js");
const authorizationMiddleware = require("../../middleware/auth.js");

projectPriorityRouter.get(
  "/count",
  authorizationMiddleware,
  projectPriorityController.getProjectPriorityCount
);
projectPriorityRouter.post(
  "/",
  authorizationMiddleware,
  projectPriorityController.createProjectPriority
);
projectPriorityRouter.get(
  "/search",
  authorizationMiddleware,
  projectPriorityController.searchProjectPriorityByName
);
projectPriorityRouter.get(
  "/:id?",
  authorizationMiddleware,
  projectPriorityController.getProjectPriority
);
projectPriorityRouter.put(
  "/:id",
  authorizationMiddleware,
  projectPriorityController.updateProjectPriority
);
projectPriorityRouter.delete(
  "/:id",
  authorizationMiddleware,
  projectPriorityController.deleteProjectPriority
);
module.exports = projectPriorityRouter;
