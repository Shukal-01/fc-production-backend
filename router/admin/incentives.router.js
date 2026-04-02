const express = require("express");
const {
  createIncentiveType,
  getAllIncentiveTypes,
  getIncentiveTypeById,
  updateIncentiveType,
  deleteIncentiveType,
} = require("../../controller/admin/incentivesType.controller");
const incentiveController = require("../../controller/admin/incentives.controller");

const IncentivesRouter = express.Router();

IncentivesRouter.post("/type/", createIncentiveType);
IncentivesRouter.get("/type/", getAllIncentiveTypes);
IncentivesRouter.get("/type/:id", getIncentiveTypeById);
IncentivesRouter.put("/type/:id", updateIncentiveType);
IncentivesRouter.delete("/type/:id", deleteIncentiveType);

// Routes for IncentiveType
IncentivesRouter.post("/", incentiveController.createIncentive);
IncentivesRouter.get("/", incentiveController.getAllIncentives);
IncentivesRouter.get("/:id", incentiveController.getIncentiveById);
IncentivesRouter.put("/:id", incentiveController.updateIncentive);
IncentivesRouter.delete("/:id", incentiveController.deleteIncentive);

module.exports = IncentivesRouter;

// /incentives/type/ - POST - Create Incentive Type
