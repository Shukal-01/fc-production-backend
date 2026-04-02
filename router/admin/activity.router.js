const express = require("express");
const activityRouter = express.Router();

const {
  createActivity,
  getAllActivity,
  deleteActivity,
  updateActivity,
  udpateStatusVisibleToCustomer,
} = require("../../controller/admin/activity.controller");

activityRouter.patch("/status/:id", udpateStatusVisibleToCustomer);
activityRouter.post("/create", createActivity);
activityRouter.get("/", getAllActivity);
activityRouter.delete("/:id", deleteActivity);
activityRouter.put("/:id", updateActivity);

module.exports = activityRouter;
