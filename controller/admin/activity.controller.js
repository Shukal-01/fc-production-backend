const { PrismaClient } = require("@prisma/client");
const { ZodError, z } = require("zod");
const prisma = new PrismaClient();

// Define the schema for activity validation
const activitySchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  visibleToCustmor: z.boolean().optional(),
  doneBy: z.string().uuid({ message: "doneBy must be a valid UUID." }),
  createdAt: z.date().optional(),
});

const createActivity = async (req, res) => {
  try {
    const { title, description, status, visibleToCustmor, doneBy } = req.body;

    // Validate the input using the activitySchema
    const validation = activitySchema.safeParse({
      title,
      description,
      status,
      visibleToCustmor,
      doneBy,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validation.error.errors, // Return validation error details
      });
    }

    // Destructure validated data
    const validatedData = validation.data;

    // Create the activity in the database
    const activity = await prisma.activity.create({
      data: {
        title: validatedData.title || null,
        description: validatedData.description || null,
        status: validatedData.status || "PENDING", // Default status
        visibleToCustmor: validatedData.visibleToCustmor || false, // Default visibility
        doneBy: validatedData.doneBy,
      },
    });

    res.status(201).json({
      success: true,
      message: "Activity created successfully.",
      data: activity,
    });
  } catch (error) {
    console.error("Error creating activity:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Get all activity API
const getAllActivity = async (req, res) => {
  try {
    // Destructure pagination parameters (optional)
    const { page = 1, limit = 10 } = req.query;

    // Ensure pagination parameters are valid
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);

    if (pageNumber < 1 || pageLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters.",
      });
    }

    // Fetch activities with pagination
    const activities = await prisma.activity.findMany({
      skip: (pageNumber - 1) * pageLimit,
      take: pageLimit,
    });

    // Get the total count of activities
    const activitiesCount = await prisma.activity.count();

    res.status(200).json({
      success: true,
      TotalActivity: activitiesCount,
      message: "All activities fetched successfully.",
      data: activities,
      pagination: {
        total: activitiesCount,
        page: pageNumber,
        limit: pageLimit,
        totalPages: Math.ceil(activitiesCount / pageLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Delete activity API

const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedActivity = await prisma.activity.delete({
      where: { id },
    });
    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
      data: deletedActivity,
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update activity API

const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, visibleToCustmor, doneBy } = req.body;

    // Check if the activity exists
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Update the activity with the provided data
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        title: title,
        description: description,
        status: status,
        visibleToCustmor: visibleToCustmor,
        doneBy: doneBy,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: updatedActivity,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// visible to customer API true or false status

const udpateStatusVisibleToCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { Visible_Status } = req.body;

    // Ensure Visible_Status is provided and is a boolean value (true or false)
    if (typeof Visible_Status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Visible_Status must be a boolean value (true or false).",
      });
    }

    // Check if the activity exists
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Update the activity with the new visibleToCustmor status
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        visibleToCustmor: Visible_Status, // Update the visibility status
        updatedAt: new Date(), // Set the updated time
      },
    });

    res.status(200).json({
      success: true,
      message: "Activity visibility updated successfully",
      data: updatedActivity,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createActivity,
  getAllActivity,
  deleteActivity,
  updateActivity,
  udpateStatusVisibleToCustomer,
};
