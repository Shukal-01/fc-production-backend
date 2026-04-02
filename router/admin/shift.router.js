const express = require("express");
const shiftRouter = express.Router();
const { createShift, getAllShift, getShiftById, updateShift, getFixedShifts, createOrUpdateFixedShift, createFixedShift, getFlexibleShifts, createFlexibleShift, updateMultipleShifts, updateFixedShifts, updateFlexibleShift, updateOrCreateFlexibleShift, deleteShift, deleteMultipleShifts } = require("../../controller/admin/shift.controller");
const authorizationMiddleware = require("../../middleware/auth");

shiftRouter.get("/fixed-shift", authorizationMiddleware, getFixedShifts);
shiftRouter.post("/fixed-shift", authorizationMiddleware, createFixedShift);
shiftRouter.put("/fixed/update", authorizationMiddleware, createOrUpdateFixedShift);//for single user
shiftRouter.put("/fixed-shift/update", authorizationMiddleware, updateFixedShifts);//for multiple users
shiftRouter.post("/flexible-shift", authorizationMiddleware, createFlexibleShift);
shiftRouter.get("/flexible-shift", authorizationMiddleware, getFlexibleShifts);
shiftRouter.put("/flexible/update", authorizationMiddleware, updateOrCreateFlexibleShift)
shiftRouter.put("/flexible-shift/update", authorizationMiddleware, updateFlexibleShift)
shiftRouter.post("/", authorizationMiddleware, createShift);
shiftRouter.delete("/multiple-shifts-delete", authorizationMiddleware, deleteMultipleShifts);
shiftRouter.delete("/:id", authorizationMiddleware, deleteShift);
shiftRouter.get("/", authorizationMiddleware, getAllShift);
shiftRouter.get("/:id", authorizationMiddleware, getShiftById);
shiftRouter.put("/:id", authorizationMiddleware, updateShift);
shiftRouter.put("/update-multiple-shifts", authorizationMiddleware, updateMultipleShifts)


module.exports = shiftRouter