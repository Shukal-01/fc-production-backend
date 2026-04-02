const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod"); // Import Zod

const prisma = new PrismaClient();

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").optional(),
  Date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.string().optional(),
  reminder: z.boolean().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  particepants: z.array(z.string()).optional(),
  attachFile: z.array(z.string()).optional(),
  eventTypeId: z.string().optional(),
});

const eventTypeSchema = z.object({
  colors: z.string().optional(),
  type: z.string().optional(),
  tasks: z.boolean().optional(),
  events: z.boolean().optional(),
});

const addEvent = async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedData = eventSchema.parse(req.body);

    // Create the event in the database
    const event = await prisma.event.create({
      data: {
        name: validatedData.name,
        Date: validatedData.Date ? new Date(validatedData.Date) : null, // Parse date
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        type: validatedData.type,
        reminder: validatedData.reminder,
        description: validatedData.description,
        location: validatedData.location,
        attachFile: validatedData.attachFile || [],
        eventTypeId: validatedData.eventTypeId,
        particepants: {
          connect: validatedData.particepants?.map((id) => ({ id })), // Connect participants
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      // Zod validation error
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({});
    const eventCount = await prisma.event.count();
    res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      TotalEvent: eventCount,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Event By Id
const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteData = await prisma.event.delete({
      where: {
        id: id,
      },
    });
    res
      .status(200)
      .json({ message: "Event delete successfully", data: deleteData });
  } catch (error) {
    res
      .status(500)
      .json({ message: "failed to delete event!" + error.message });
  }
};

// Update Event By ID
const updateEvent = async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedData = eventSchema.parse(req.body);

    // Extract the event ID from the request params or body (assuming params here)
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required for updating",
      });
    }

    // Update the event in the database
    const event = await prisma.event.update({
      where: { id }, // Specify which event to update
      data: {
        name: validatedData.name,
        Date: validatedData.Date ? new Date(validatedData.Date) : null, // Parse date
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        type: validatedData.type,
        reminder: validatedData.reminder,
        description: validatedData.description,
        location: validatedData.location,
        attachFile: validatedData.attachFile || [],
        eventTypeId: validatedData.eventTypeId,
        particepants: {
          set: [], // Clear existing participants first
          connect: validatedData.particepants?.map((id) => ({ id })), // Add new participants
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      // Handle Zod validation error
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// create event type API
const createEventTypes = async (req, res) => {
  try {
    // add zod validation here
    const EventTypeValidatedData = eventTypeSchema.parse(req.body);
    const eventType = await prisma.eventType.create({
      data: {
        colors: EventTypeValidatedData.colors,
        type: EventTypeValidatedData.type,
        tasks: EventTypeValidatedData.tasks,
        events: EventTypeValidatedData.events,
      },
    });
    res.status(201).json({
      success: true,
      message: "Event type created successfully",
      data: eventType,
    });
  } catch (error) {
    console.error("Error creating event type:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all event type
const getAllEventTypes = async (req, res) => {
  try {
    const eventTypes = await prisma.eventType.findMany({});
    const eventTypesCount = await prisma.eventType.count({});
    res.status(200).json({
      success: true,
      TotalEventType: eventTypesCount,
      message: "Event types fetched successfully",
      data: eventTypes,
    });
  } catch (error) {
    console.error("Error fetching event types:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Event Type By Id
const deleteEventType = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteData = await prisma.eventType.delete({
      where: {
        id: id,
      },
    });
    res
      .status(200)
      .json({ message: "Event type delete successfully", data: deleteData });
  } catch (error) {
    res
      .status(500)
      .json({ message: "failed to delete event type!" + error.message });
  }
};

// update event type by id
const updateEventType = async (req, res) => {
  try {
    const { id } = req.params;
    const EventTypeValidatedData = eventTypeSchema.parse(req.body);
    const eventType = await prisma.eventType.update({
      where: {
        id: id,
      },
      data: {
        colors: EventTypeValidatedData.colors,
        type: EventTypeValidatedData.type,
        tasks: EventTypeValidatedData.tasks,
        events: EventTypeValidatedData.events,
      },
    });
    res.status(200).json({
      success: true,
      message: "Event type updated successfully",
      data: eventType,
    });
  } catch (error) {
    console.error("Error updating event type:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  addEvent,
  getAllEvents,
  deleteEvent,
  updateEvent,
  createEventTypes,
  getAllEventTypes,
  deleteEventType,
  updateEventType,
};
