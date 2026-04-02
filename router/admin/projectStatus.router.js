const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const projectStatusRouter = express.Router();
const projectStatusController = require("../../controller/admin/project/projectStatus.controller.js");
const authorizationMiddleware = require("../../middleware/auth.js");

projectStatusRouter.get(
  "/count",
  authorizationMiddleware,
  projectStatusController.projectStatusCount
);
projectStatusRouter.post(
  "/",
  authorizationMiddleware,
  projectStatusController.projectStatus
);
projectStatusRouter.put(
  "/:id",
  authorizationMiddleware,
  projectStatusController.updateProjectStatus
);
projectStatusRouter.get(
  "/search-status",
  authorizationMiddleware,
  projectStatusController.searchProjectStatusByName
);
projectStatusRouter.get(
  "/",
  authorizationMiddleware,
  projectStatusController.getProjectStatus
);
projectStatusRouter.delete(
  "/:id",
  authorizationMiddleware,
  projectStatusController.deleteProjectStatus
);

module.exports = projectStatusRouter;
