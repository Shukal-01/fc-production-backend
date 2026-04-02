const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = express();
const { ZodError } = require("zod");
const { projectStatusSchema } = require("../../../utils/validations.js");

app.use(express.json());

const projectStatus = async (req, res) => {
  const {
    project_name,
    project_color,
    default_filter,
    project_order,
    can_changed,
  } = req.body;

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
      .json({ message: "Only admin can create project status!" });
  }

  // Validate the request data using projectStatusSchema
  const validationResult = projectStatusSchema.safeParse({
    project_name,
    project_color,
    project_order,
    default_filter,
    can_changed: can_changed || [],
  });

  // If validation fails, return a 400 error with validation issues
  if (!validationResult.success) {
    return res.status(400).json({
      status: false,
      message: "Invalid request data",
      error: validationResult.error.issues[0].message,
    });
  }

  try {
    // Ensure `can_changed` is treated as an array of non-null values
    const canChangedIds = Array.isArray(validationResult.data.can_changed)
      ? validationResult.data.can_changed.filter((id) => id != null)
      : [validationResult.data.can_changed].filter((id) => id != null);

    // Create ProjectStatus with self-referencing relation
    const addProjectStatus = await prisma.projectStatus.create({
      data: {
        adminId: req.userId,
        project_name: validationResult.data.project_name,
        project_color: validationResult.data.project_color,
        project_order: validationResult.data.project_order,
        default_filter: !!validationResult.data.default_filter, // Convert to boolean
        can_changed: canChangedIds.length
          ? { connect: canChangedIds.map((id) => ({ id })) } // Connect self-referencing relations
          : undefined, // Skip if no relations are provided
      },
      include: {
        can_changed: true, // Include self-referencing relation in the response
      },
    });

    return res.status(201).json({
      message: "Project Status Added Successfully!",
      data: addProjectStatus,
    });
  } catch (error) {
    console.error("Failed to add project status:", error.message); // Log the error for debugging
    return res.status(500).json({
      message: "Failed to add project status!" + error.message,
    });
  }
};

// get project status
const getProjectStatus = async (req, res) => {
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
        .json({ message: "Only admin can fetch all project status!" });
    }
    const projectStatus = await prisma.projectStatus.findMany({
      where: {
        adminId: req.userId,
      },
      include: {
        can_changed: true,
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
      },
    });
    return res.status(200).json({
      message: "Project Status Get Successfully!",
      data: projectStatus,
    });
  } catch (error) {
    console.error("Failed to adding project status:", error.message); // Log the error for debugging
    return res
      .status(500)
      .json({ message: "Failed to adding project status:" + error.message });
  }
};

// update project status
const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
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
        .json({ message: "Only admin can update project status!" });
    }
    const {
      project_name,
      project_color,
      project_order,
      default_filter,
      can_changed,
    } = req.body;
    // console.log(id, req.body);

    const ProjectStatusResult = projectStatusSchema.safeParse({
      project_name,
      project_color,
      project_order,
      default_filter: !!default_filter,
      can_changed: can_changed || [],
    });

    if (!ProjectStatusResult.success) {
      // console.log(ProjectStatusResult);
      return res.status(400).json({
        error: ProjectStatusResult.error.issues[0].message,
      });
    }

    // Validate `can_changed` IDs
    if (can_changed && can_changed.length > 0) {
      const existingChangedRecords = await prisma.projectStatus.findMany({
        where: { id: { in: can_changed } },
        select: { id: true },
      });
      const validChangedIds = existingChangedRecords.map((record) => record.id);

      if (validChangedIds.length !== can_changed.length) {
        return res.status(400).json({
          error: "Some `can_changed` IDs do not exist in the database.",
        });
      }
    }

    // Prepare data for update
    const updateData = {
      project_name,
      project_color,
      project_order,
      default_filter,
      // First clear existing relations to avoid FK violations
      can_changed: { set: [] },
    };
    // Perform the update with cleared relations
    const updatedProjectStatus = await prisma.projectStatus.update({
      where: { id },
      data: updateData,
    });
    // console.log(updatedProjectStatus);

    // Reconnect the `can_changed` relations if provided
    if (can_changed && can_changed.length > 0) {
      await prisma.projectStatus.update({
        where: { id },
        data: {
          can_changed: {
            connect: can_changed.map((id) => ({ id })),
          },
        },
      });
    }

    // Fetch the final updated record
    const finalUpdatedProjectStatus = await prisma.projectStatus.findUnique({
      where: { id },
      include: { can_changed: true },
    });

    res.status(200).json({
      message: "Project Status successfully updated!",
      updatedProjectStatus: finalUpdatedProjectStatus,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      // console.log(error);
      res.status(400).json({ message: "Invalid request data" });
    } else {
      console.error("Failed updating project status:", error.message);
      res.status(500).json({
        message: "Failed to update project status: " + error.message,
      });
    }
  }
};

const searchProjectStatusByName = async (req, res) => {
  try {
    const { project_name, page = 1, limit = 10 } = req.query;

    // Convert pagination values to integers
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
        .json({ message: "Only admin can search project status by name!" });
    }

    // Fetch paginated project statuses
    const SearchProjectStatus = await prisma.projectStatus.findMany({
      where: {
        adminId: req.userId,
        project_name: {
          contains: project_name || "", // Defaults to an empty string if not provided
          mode: "insensitive",
        },
      },
      skip,
      take: limitNum,
    });

    // Count total matching records
    const totalRecords = await prisma.projectStatus.count({
      where: {
        project_name: {
          contains: project_name || "", // Defaults to an empty string if not provided
          mode: "insensitive",
        },
      },
    });

    // Return response with pagination metadata
    res.status(200).json({
      message: "Successfully searched project statuses",
      data: SearchProjectStatus,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Failed to search project status:", error.message);
    res.status(500).json({
      message: "Failed to search project status: " + error.message,
    });
  }
};

const deleteProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;

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
        .json({ message: "Only admin can delete project status!" });
    }

    // Check if the ProjectStatus with the given ID exists
    const existingProjectStatus = await prisma.projectStatus.findUnique({
      where: { id },
    });

    if (!existingProjectStatus) {
      return res.status(404).json({
        status: false,
        message: "Project Status not found",
      });
    }

    // Delete the ProjectStatus record
    await prisma.projectStatus.delete({
      where: { id },
    });

    res.status(200).json({
      status: true,
      message: "Project Status successfully deleted!",
    });
  } catch (error) {
    console.error("Failed to delete project status:", error.message);
    res.status(500).json({
      status: false,
      message: "Failed to delete project status: " + error.message,
    });
  }
};

// Project status count API
const projectStatusCount = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });
    console.log(admin);
    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can get project status count!" });
    }
    const count = await prisma.projectStatus.count({
      where: {
        adminId: req.userId,
      },
    });

    return res.status(200).json({
      message: "Successfully fetched project status count",
      count,
    });
  } catch (error) {
    console.error("Failed to fetch project status count:", error.message);
    res.status(500).json({
      message: "Failed to fetch project status count: " + error.message,
    });
  }
};

module.exports = {
  projectStatus,
  getProjectStatus,
  updateProjectStatus,
  searchProjectStatusByName,
  deleteProjectStatus,
  projectStatusCount,
};
