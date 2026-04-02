const express = require("express");
const pastEmploymentRouter = express.Router();
const {
    createPastEmployment,
    getAllPastEmployment,
    getPastEmploymentById,
    updatePastEmployment,
    deletePastEmployment,
} = require("../../controller/admin/staff/pastEmployment.controller");

pastEmploymentRouter.get("/", getAllPastEmployment);
pastEmploymentRouter.get("/:id", getPastEmploymentById);
pastEmploymentRouter.post("/", createPastEmployment);
pastEmploymentRouter.put("/:id", updatePastEmployment);
pastEmploymentRouter.delete("/:id", deletePastEmployment);

module.exports = pastEmploymentRouter;
