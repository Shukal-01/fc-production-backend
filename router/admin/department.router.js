const express = require("express");
const departmentRouter = express.Router();
const departmentController = require("../../controller/admin/department.controller");
const authorizationMiddleware = require("../../middleware/auth");

departmentRouter.delete(
  "/bulk",
  authorizationMiddleware,
  departmentController.deleteDepartmentsInBulk
);

departmentRouter.post(
  "/",
  authorizationMiddleware,
  departmentController.addDepartment
);
departmentRouter.get(
  "/search",
  authorizationMiddleware,
  departmentController.searchDepartmentByName
);
departmentRouter.delete(
  "/bulk",
  authorizationMiddleware,
  departmentController.deleteDepartmentsInBulk
);
departmentRouter.put(
  "/:id",
  authorizationMiddleware,
  departmentController.updateDepartment
);
departmentRouter.get(
  "/",
  authorizationMiddleware,
  departmentController.fetchDepartment
);
departmentRouter.delete(
  "/bulk",
  authorizationMiddleware,
  departmentController.deleteDepartmentsInBulk
);
departmentRouter.delete(
  "/:id",
  authorizationMiddleware,
  departmentController.deleteDepartment
);
departmentRouter.get(
  "/:id",
  authorizationMiddleware,
  departmentController.showDepartment
);

module.exports = departmentRouter;
