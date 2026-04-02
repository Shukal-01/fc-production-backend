const { PrismaClient } = require("@prisma/client");
const { projectPrioritySchema } = require("../../../utils/validations");
const { ZodError } = require("zod");
const prisma = new PrismaClient();

// Project Priority
const createProjectPriority = async (req, res) => {
  try {
    const {
      Priority_name,
      Priority_color,
      Priority_order,
      default_filter,
      is_hidden,
      can_changed,
    } = req.body;
    // console.log(req.body)

    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can create project priority!" });
    }

    // Validate the incoming data
    const ProjectPriorityResult = projectPrioritySchema.parse({
      Priority_name,
      Priority_color,
      Priority_order, // Prisma expects this as a string in your model
      default_filter: !!default_filter, // Ensure boolean value
      is_hidden: is_hidden || [], // Ensure array or default to empty array
      can_changed: can_changed || [], // Ensure array or default to empty array
    });
    // if (!ProjectPriorityResult.success) {
    //   return res.status(400).json({
    //     status: false,
    //     message: ProjectPriorityResult.error.issues[0].message,
    //   });
    // }

    // Create the ProjectPriority record
    const projectPriority = await prisma.projectPriority.create({
      data: {
        adminId: req.userId,
        Priority_name: ProjectPriorityResult.Priority_name,
        Priority_color: ProjectPriorityResult.Priority_color,
        Priority_order: ProjectPriorityResult.Priority_order, // Convert number to string
        default_filter: ProjectPriorityResult.default_filter,
        is_hidden: ProjectPriorityResult.is_hidden.length
          ? { connect: ProjectPriorityResult.is_hidden.map((id) => ({ id })) }
          : undefined,
        can_changed: ProjectPriorityResult.can_changed.length
          ? { connect: ProjectPriorityResult.can_changed.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        is_hidden: true,
        can_changed: true,
      },
    });

    return res.status(201).json({
      message: "Project Priority successfully created!",
      projectPriority,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message).join(", ") });
    }

    console.error("Failed to create project priority:", error);
    return res
      .status(500)
      .json({ error: "Failed to create project priority: " + error.message });
  }
};

// get project Priority
const getProjectPriority = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can fetch all project priority!" });
    }
    const projectPriorities = await prisma.projectPriority.findMany({
      where: {
        adminId: req.userId,
      },
      include: {
        Project: {
          include: {
            TaskDetail: true,
            staffId: {
              include: {
                User: true,
              },
            },
            customerDetails: {
              include: {
                user: true,
              },
            },
            projectStatus: true,
          },
        },
        is_hidden: {
          include: {
            User: true,
          },
        }, // Include the `is_hidden` relation in the response
        can_changed: true, // Include the `can_changed` relation in the response
      },
    });

    return res.status(200).json({
      message: "Project Priorities fetched successfully!",
      data: projectPriorities,
    });
  } catch (error) {
    console.error("Failed to fetch project priorities:", error);
    return res.status(500).json({
      message: "Failed to fetch project priorities!",
      error: error.message,
    });
  }
};

// update project Priority
const updateProjectPriority = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID of the Project Priority from the URL
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can update project priority!" });
    }
    const {
      Priority_name,
      Priority_color,
      Priority_order,
      default_filter,
      is_hidden,
      can_changed,
    } = req.body;

    // Validate the incoming data using projectPrioritySchema
    const ProjectPriorityResult = projectPrioritySchema.safeParse({
      Priority_name,
      Priority_color,
      Priority_order,
      default_filter: !!default_filter,
      is_hidden: is_hidden || [], // Ensure it's an array
      can_changed: can_changed || [], // Ensure it's an array
    });

    if (!ProjectPriorityResult.success) {
      return res
        .status(400)
        .json({ error: ProjectPriorityResult.error.issues[0].message });
    }

    // Check if `is_hidden` IDs exist
    if (is_hidden && is_hidden.length > 0) {
      const existingHiddenRecords = await prisma.staffDetails.findMany({
        where: { id: { in: is_hidden } },
        select: { id: true },
      });
      const validHiddenIds = existingHiddenRecords.map((record) => record.id);

      if (validHiddenIds.length !== is_hidden.length) {
        return res.status(400).json({
          message: "Some `is_hidden` IDs do not exist in the database.",
        });
      }
    }

    // Check if `can_changed` IDs exist
    if (can_changed && can_changed.length > 0) {
      const existingChangedRecords = await prisma.projectPriority.findMany({
        where: { id: { in: can_changed } },
        select: { id: true },
      });
      const validChangedIds = existingChangedRecords.map((record) => record.id);

      if (validChangedIds.length !== can_changed.length) {
        return res.status(400).json({
          message: "Some `can_changed` IDs do not exist in the database.",
        });
      }
    }

    // Prepare the data to be updated
    const updateData = {
      Priority_name,
      Priority_color,
      Priority_order: Priority_order.toString(), // Convert to string if needed
      default_filter,
    };

    // console.log(is_hidden, can_changed);

    // Update the project priority in the database
    const updatedProjectPriority = await prisma.projectPriority.update({
      where: { id },
      data: {
        ...updateData,
        is_hidden: {
          set: (is_hidden || []).map((id) => ({ id })),
        },
        can_changed: {
          set: (can_changed || []).map((id) => ({ id })),
        },
      },
      include: {
        is_hidden: true,
        can_changed: true,
      },
    });
    res.status(200).json({
      message: "Project Priority successfully updated!",
      updatedProjectPriority,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Invalid request data" });
    } else {
      console.error("Failed updating project priority:", error.message);
      res.status(500).json({
        message: "Failed to update project priority: " + error.message,
      });
    }
  }
};

const searchProjectPriorityByName = async (req, res) => {
  try {
    const { name = "", page = 1, limit = 10 } = req.query;

    // Convert pagination parameters to integers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can search project priority by name!" });
    }

    // Fetch paginated project priorities
    const projectPriority = await prisma.projectPriority.findMany({
      where: {
        Priority_name: {
          contains: name, // Match the provided name
          mode: "insensitive", // Case-insensitive search
        },
        adminId: req.userId,
      },
      skip,
      take: limitNum,
    });

    // Count total matching records
    const totalRecords = await prisma.projectPriority.count({
      where: {
        Priority_name: {
          contains: name,
          mode: "insensitive",
        },
        adminId: req.userId,
      },
    });

    // Respond with paginated data and metadata
    return res.status(200).json({
      message: "Successfully searched project priorities",
      data: projectPriority,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Failed searching project priority:", error);
    return res.status(500).json({
      message: "Failed to search project priority: " + error.message,
    });
  }
};

const deleteProjectPriority = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Project Priority Id is required" });
    }
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can delete project priority!" });
    }
    const deletedProjectPriority = await prisma.projectPriority.delete({
      where: { id },
    });
    res.status(200).json({
      message: "Project Priority successfully deleted!",
      deletedProjectPriority,
    });
  } catch (error) {
    console.error("Failed deleting project priority:", error);
    res.status(500).json({
      message: "Failed to delete project priority: " + error.message,
    });
  }
};

// Get Count project priority
const getProjectPriorityCount = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });
    // console.log(admin);
    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can get project priority count!" });
    }
    const count = await prisma.projectPriority.count({
      where: {
        adminId: req.userId,
      },
    });

    return res.status(200).json({
      message: "Successfully fetched project priority count",
      count,
    });
  } catch (error) {
    console.error("Failed fetching project priority count:", error);
    return res.status(500).json({
      message: "Failed to fetch project priority count: " + error.message,
    });
  }
};

module.exports = {
  createProjectPriority,
  getProjectPriority,
  updateProjectPriority,
  deleteProjectPriority,
  searchProjectPriorityByName,
  getProjectPriorityCount,
};
