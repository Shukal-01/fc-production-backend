const { Router } = require("express");
const {
  addEvent,
  createEventTypes,
  getAllEvents,
  deleteEvent,
  updateEvent,
  getAllEventTypes,
  deleteEventType,
  updateEventType,
} = require("../../controller/admin/event.controller.js");

const EventRouter = Router();

// Events API
EventRouter.post("/create", addEvent);
EventRouter.get("/", getAllEvents);
EventRouter.delete("/:id", deleteEvent);
EventRouter.put("/:id", updateEvent);

// Events types API
EventRouter.post("/create-type", createEventTypes);
EventRouter.get("/types", getAllEventTypes);
EventRouter.delete("/types/:id", deleteEventType);
EventRouter.put("/types/:id", updateEventType);

module.exports = EventRouter;
