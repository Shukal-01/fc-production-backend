const { Router } = require("express");
const {
    addFineData, updateMultipleFineData,
    getFinesByDate,
    updateFine,
    getAllFine,
} = require("../../controller/admin/staff/attendence/fine.controller.js");
//fine controller
const FineRouter = Router();

FineRouter.post("/create", addFineData);
FineRouter.put("/", updateMultipleFineData)
FineRouter.get("/", getFinesByDate);
FineRouter.put("/:id", updateFine);
FineRouter.get("/all", getAllFine)

module.exports = FineRouter;
