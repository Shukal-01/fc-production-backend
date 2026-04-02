const express = require("express");
const projectRouter = express.Router();
const projectController = require("../../controller/admin/project/project.controller.js");
const authorizationMiddleware = require("../../middleware/auth.js");

projectRouter.get(
  "/count",
  authorizationMiddleware,
  projectController.getProjectCount
);

projectRouter.post(
  "/create",
  authorizationMiddleware,
  projectController.addProject
);
projectRouter.get("/", authorizationMiddleware, projectController.getProject);
projectRouter.put(
  "/:id",
  authorizationMiddleware,
  projectController.updateProject
);
projectRouter.delete(
  "/bulk",
  authorizationMiddleware,
  projectController.deleteProjectsBulk
);
projectRouter.delete(
  "/:id",
  authorizationMiddleware,
  projectController.deleteProject
);
projectRouter.get(
  "/:id",
  authorizationMiddleware,
  projectController.showProject
);
projectRouter.get(
  "/search-projectByName",
  authorizationMiddleware,
  projectController.SearchingProjectsByName
);

module.exports = projectRouter;
