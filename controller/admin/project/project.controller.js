const { PrismaClient } = require("@prisma/client");
const { sendProjectCreatedMail } = require("../../../utils/mailer");
const { projectSchema } = require("../../../utils/validations.js");
const prisma = new PrismaClient();
const notificationEmitter = require("../../../middleware/notification.middleware.js");

const addProject = async (req, res) => {
  const {
    staffId,
    project_name,
    customerId,
    billing_type,
    status,
    priority,
    total_rate,
    start_date,
    deadline,
    description,
    tags,
    estimated_hours,
    send_mail,
  } = req.body;

  // console.log(req.body);

  // Validate request body using projectSchema
  const validationResult = projectSchema.safeParse({
    staffId,
    project_name,
    customerId,
    billing_type,
    status,
    priority,
    total_rate,
    start_date,
    deadline,
    description,
    tags,
    estimated_hours,
    send_mail,
  });

  if (!validationResult.success) {
    // console.log(validationResult.error);
    return res.status(400).json({
      msg: "Invalid request data",
      errors: validationResult.error.issues.map((issue) => issue.message),
    });
  }

  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }

    if (admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only admin can create projects!" });
    }

    const client = await prisma.clientDetails.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // console.log(client, customerId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const staff = await prisma.staffDetails.findMany({
      where: {
        id: {
          in: staffId,
        },
      },
    });

    const createdProject = await prisma.project.create({
      data: {
        project_name,
        billing_type,
        projectStatus: {
          connect: {
            id: status,
          },
        },
        projectPriority: {
          connect: {
            id: priority,
          },
        },
        total_rate: parseInt(total_rate),
        start_date,
        deadline,
        description,
        tags,
        estimated_hours: parseInt(estimated_hours),
        send_mail,
        admin: {
          connect: {
            id: admin.id,
          },
        },
        customerDetails: customerId
          ? {
              connect: {
                id: customerId,
              },
            }
          : undefined,
        staffId: {
          connect: staffId.map((id) => ({ id })),
        },
      },
    });

    const userId = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    // Record activity in Activity table
    await prisma.activity.create({
      data: {
        title: "Project Created",
        description: `Project "${project_name}" has been created.`,
        status: "Created",
        doneBy: userId.id,
        visibleToCustmor: false,
      },
    });

    // console.log(client);
    await sendProjectCreatedMail(client.user.email, project_name);

    return res.status(201).json({
      success: true,
      message: "Project created successfully and notifications sent to staff",
      data: createdProject,
    });
  } catch (error) {
    console.error("Error creating project:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Projects
const getProject = async (req, res) => {
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
        .json({ message: "Only admin can update project priority!" });
    }
    // // Extract pagination query parameters
    const { page = 1, limit = 10 } = req.query;

    // // Convert query parameters to integers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // // Calculate the number of records to skip
    const skip = (pageNum - 1) * limitNum;

    // Fetch projects with pagination
    const Projects = await prisma.project.findMany({
      where: {
        adminId: req.userId,
      },
      skip,
      take: limitNum,
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
    });

    // Calculate the total number of records
    const totalProjects = await prisma.project.count();

    return res.status(200).json({
      message: "Projects fetched successfully",
      data: Projects,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalProjects / limitNum),
        totalRecords: Projects.length,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

// Show By ID Project Query............................

const showProject = async (req, res) => {
  if (req.params.id === "search-projectByName") {
    return SearchingProjectsByName(req, res);
  }
  try {
    const ProjectID = req.params.id;
    const Projects = await prisma.project.findMany({
      where: {
        id: ProjectID,
        adminId: req.userId,
      },
    });
    return res
      .status(200)
      .json({ message: "Project fetched ById successfully", data: Projects });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "failed to get projects" + error.message });
  }
};

// Project Delete Query......................

const deleteProject = async (req, res) => {
  const projectID = req.params.id;
  try {
    const deletedProject = await prisma.project.delete({
      where: {
        id: projectID,
      },
    });
    return res
      .status(200)
      .json({ message: "Project deleted successfully!", deletedProject });
  } catch (error) {
    if (error.code) {
      return res
        .status(500)
        .json({ message: "Failed to delete project" + error.message });
    }
  }
};

// Delete Projects In Bulk
const deleteProjectsBulk = async (req, res) => {
  const projectIDs = req.body.projectIds; // Expecting an array of project IDs from the frontend
  try {
    const deletedProjects = await prisma.project.deleteMany({
      where: {
        id: { in: projectIDs }, // Deletes projects where IDs match any in the provided array
      },
    });

    if (deletedProjects.count === 0) {
      return res.status(404).json({ message: "No projects found to delete!" });
    }

    return res.status(200).json({
      message: "Projects deleted successfully!",
      deletedCount: deletedProjects.count,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete projects: " + error.message });
  }
};

// Project Update Query............................

const updateProject = async (req, res) => {
  const projectID = req.params.id;
  try {
    const {
      staffId,
      project_name,
      customerId,
      billing_type,
      status,
      priority,
      total_rate,
      start_date,
      deadline,
      description,
      tags,
      estimated_hours,
      send_mail,
    } = req.body;

    // Validate request body using projectSchema
    const validationResult = projectSchema.safeParse({
      staffId,
      project_name,
      customerId,
      billing_type,
      status,
      priority,
      total_rate,
      start_date,
      deadline,
      description,
      tags,
      estimated_hours,
      send_mail,
    });

    if (!validationResult.success) {
      // console.log(validationResult.error);
      return res.status(400).json({
        msg: "Invalid request data",
        errors: validationResult.error.issues.map((issue) => issue.message),
      });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectID },
    });

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update project with relationships and data
    const updatedProject = await prisma.project.update({
      where: {
        id: projectID,
      },
      data: {
        project_name,
        billing_type,
        projectStatus: {
          connect: {
            id: status, // Linking status through relation
          },
        },
        projectPriority: {
          connect: {
            id: priority, // Linking priority through relation
          },
        },
        total_rate: parseInt(total_rate),
        start_date,
        deadline,
        description,
        tags,
        estimated_hours: parseInt(estimated_hours),
        send_mail,
        admin: {
          connect: {
            id: req.userId, // Ensure the admin is linked correctly
          },
        },
        customerDetails: customerId
          ? {
              connect: {
                id: customerId, // Linking customerDetails through relation
              },
            }
          : undefined,
        staffId: {
          set: staffId ? staffId.map((id) => ({ id })) : [],
        },
      },
    });
    return res
      .status(200)
      .json({ message: "Project updated successfully!", data: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error.message);

    if (error.code === "P2025") {
      // Handle case where the record to update does not exist
      return res.status(404).json({ message: "Project not found!" });
    }

    return res
      .status(500)
      .json({ message: "Failed to update project!", error: error.message });
  }
};

// Search Project Query............................

const SearchingProjectsByName = async (req, res) => {
  const { project_name, page = 1, limit = 10 } = req.query;

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch projects with pagination
    const projects = await prisma.project.findMany({
      where: {
        project_name: {
          contains: project_name?.trim() || "",
          mode: "insensitive",
        },
        adminId: req.userId,
      },
      include: {
        customerDetails: true,
        projectStatus: true,
        staffId: {
          include: {
            User: true,
          },
        },
      },
      skip,
      take: limitNum,
    });

    // Count total matching projects
    const totalProjects = await prisma.project.count({
      where: {
        project_name: {
          contains: project_name?.trim() || "",
          mode: "insensitive",
        },
      },
    });

    // Return paginated response
    res.status(200).json({
      data: projects,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalProjects / limitNum),
        totalRecords: totalProjects,
      },
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error.message);
    res.status(500).json({
      status: false,
      message: "Failed to search projects: " + error.message,
    });
  }
};

// get project count

const getProjectCount = async (req, res) => {
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
      return res.status(400).json({ message: "Only admin can get projects!" });
    }

    const projectCount = await prisma.project.count({
      where: {
        adminId: req.userId,
      },
    });

    return res.status(200).json({
      message: "Successfully fetched project count",
      count: projectCount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to get project count: " + error.message });
  }
};

module.exports = {
  addProject,
  updateProject,
  deleteProject,
  showProject,
  getProject,
  SearchingProjectsByName,
  deleteProjectsBulk,
  getProjectCount,
};
