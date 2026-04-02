const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ZodError } = require("zod");
const {
  TaskPrioritySchema,
  TaskStatusSchema,
  TaskDetailSchema,
} = require("../../utils/validations");
const notificationEmitter = require("../../middleware/notification.middleware");

async function createTaskStatus(req, res) {
  try {
    const {
      taskStatusName,
      statusColor,
      statusOrder,
      isHiddenFor,
      canBeChangedId,
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
      return res.status(400).json({ message: "Only admin can create task!" });
    }

    // console.log(req.body);

    // Validate the taskStatus data using TaskStatusSchema
    const TaskStatusResult = TaskStatusSchema.safeParse({
      taskStatusName,
      statusColor,
      statusOrder,
      isHiddenFor: isHiddenFor || [],
      canBeChangedId: canBeChangedId || [],
    });

    // Check if TaskStatusResult is valid
    if (!TaskStatusResult.success) {
      return res.status(400).json({
        status: false,
        message: TaskStatusResult.error.issues[0].message,
      });
    }

    // Create TaskStatus
    const taskStatus = await prisma.taskStatus.create({
      data: {
        ...TaskStatusResult.data,
        adminId: req.userId,
        isHiddenFor:
          isHiddenFor && isHiddenFor.length
            ? { connect: (isHiddenFor || []).map((id) => ({ id })) }
            : undefined, // Only connect if the array is not empty
        canBeChangedId:
          canBeChangedId && canBeChangedId.length
            ? { connect: (canBeChangedId || []).map((id) => ({ id })) }
            : undefined, // Only connect if the array is not empty
      },
      include: {
        isHiddenFor: true, // Include the isHiddenFor relation in the response
        canBeChangedId: true, // Include the canBeChangedId relation in the response
      },
    });

    res
      .status(201)
      .json({ message: "Task status successfully created!", taskStatus });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      // console.log(error);
      res
        .status(500)
        .json({ error: "Failed to create new task status: " + error.message });
    }
  }
}

async function getAllTaskStatus(req, res) {
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
        .json({ message: "Only admin can fetch all task status!" });
    }
    const taskStatus = await prisma.taskStatus.findMany({
      where: { adminId: req.userId },
      include: {
        isHiddenFor: {
          include: {
            User: true,
          },
        }, // Include the isHiddenId relation in the response
        TaskDetail: {
          include: {
            taskAssignee: {
              include: {
                User: true,
              },
            },
            department: true,
            Project: true,
            taskPriority: true,
            taskStatus: true,
          },
        },
        TaskStatus: true,
        canBeChangedId: true,
      },
    });
    res
      .status(200)
      .json({ message: "takstatus fetch successfully", taskStatus });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ error: "Failed to fetch task status" + error.message });
  }
}

async function deleteTaskDetail(req, res) {
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
      .json({ message: "Only admin can delete task status!" });
  }
  try {
    // Check if the task exists before attempting to delete
    const taskDetail = await prisma.taskDetail.findUnique({
      where: { id },
    });

    if (!taskDetail) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Delete the task detail
    await prisma.taskDetail.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ taskDetail, message: "Task detail successfully deleted!" });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ error: "Failed to delete task detail" + error.message });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params; // Get the ID of the task status from the URL
    const {
      taskStatusName,
      statusColor,
      statusOrder,
      isHiddenFor,
      canBeChangedId,
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
        .json({ message: "Only admin can update task status!" });
    }

    // Validate the incoming data using TaskStatusSchema
    const TaskStatusResult = TaskStatusSchema.safeParse({
      taskStatusName,
      statusColor,
      statusOrder,
      isHiddenFor,
      canBeChangedId: canBeChangedId || [],
    });

    if (!TaskStatusResult.success) {
      return res
        .status(400)
        .json({ message: TaskStatusResult.error.issues[0].message });
    }

    // Prepare the data to be updated
    const updateData = {
      ...TaskStatusResult.data,
      isHiddenFor:
        isHiddenFor && isHiddenFor.length
          ? { connect: isHiddenFor.map((id) => ({ id })) }
          : undefined, // Only connect if the array is not empty
      canBeChangedId:
        canBeChangedId && canBeChangedId.length
          ? { connect: canBeChangedId.map((id) => ({ id })) }
          : undefined, // Only connect if the array is not empty
    };

    // Update the task status in the database
    const updatedTaskStatus = await prisma.taskStatus.update({
      where: { id: id }, // Find the task status by ID
      data: updateData, // Update data with the prepared data
      include: {
        isHiddenFor: {
          include: {
            User: true,
          },
        }, // Include the isHiddenFor relation in the response
        canBeChangedId: true, // Include the canBeChangedId relation in the response
      },
    });

    res.status(200).json({
      message: "Task status successfully updated!",
      updatedTaskStatus,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      // console.log(error);
      res
        .status(500)
        .json({ error: "Failed to update task status: " + error.message });
    }
  }
}

async function deleteTaskStatus(req, res) {
  try {
    const { id } = req.params; // Get the ID of the task status from the URL
    if (!id) {
      return res.status(400).json({ error: "Task status ID is required" });
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
        .json({ message: "Only admin can delete task status!" });
    }
    const deletedTaskStatus = await prisma.taskStatus.delete({
      where: { id: id }, // Find the task status by ID
    });
    res.status(200).json({
      message: "Task status successfully deleted!",
      deletedTaskStatus,
    });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ error: "Failed to delete task status" + error.message });
  }
}

async function createTaskPriority(req, res) {
  try {
    const { taskPriorityName } = req.body;

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
        .json({ message: "Only admin can create task priority!" });
    }

    // Validate the taskTypeName using TaskTypeSchema
    const taskPriorityResult = TaskPrioritySchema.safeParse({
      taskPriorityName,
    });

    if (!taskPriorityResult.success) {
      return res
        .status(400)
        .json({ message: taskPriorityResult.error.issues[0].message });
    }

    const taskPriority = await prisma.taskPriority.create({
      data: { ...taskPriorityResult.data, adminId: req.userId },
    });
    res
      .status(201)
      .json({ taskPriority, message: "Task priority successfully created!" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      // console.log(error);
      res
        .status(500)
        .json({ error: "Failed to create new task priority" + error.message });
    }
  }
}

async function getAllTaskPriority(req, res) {
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
        .json({ message: "Only admin can fetch all task priority!" });
    }
    const taskPriority = await prisma.taskPriority.findMany({
      where: { adminId: req.userId },
      include: {
        TaskDetail: {
          include: {
            taskAssignee: {
              include: {
                User: true,
              },
            },
            department: true,
            Project: true,
            taskPriority: true,
            taskStatus: true,
          },
        },
      },
    });
    res
      .status(200)
      .json({ taskPriority, message: "Task priority fetch successfully" });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ error: "Failed to fetch task priority" + error.message });
  }
}

async function updateTaskPriority(req, res) {
  try {
    const { id } = req.params; // Assuming the ID of the task priority is passed in the URL
    const { taskPriorityName } = req.body; // Assuming the name of the task priority is passed in the request body

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
        .json({ message: "Only admin can update task priority!" });
    }

    // Validate the incoming data using TaskPrioritySchema
    const taskPriorityResult = TaskPrioritySchema.safeParse({
      taskPriorityName,
    });

    if (!taskPriorityResult.success) {
      return res
        .status(400)
        .json({ message: taskPriorityResult.error.issues[0].message });
    }

    // Update the task priority in the database
    const updatedTaskPriority = await prisma.taskPriority.update({
      where: { id: id }, // Convert ID to a number if necessary
      data: taskPriorityResult.data,
    });

    res.status(200).json({
      updatedTaskPriority,
      message: "Task priority successfully updated!",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      // console.log(error);
      res
        .status(500)
        .json({ error: "Failed to update task priority" + error.message });
    }
  }
}

async function deleteTaskPriority(req, res) {
  try {
    const { id } = req.params; // Assuming the ID of the task priority is passed in the URL
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
        .json({ message: "Only admin can delete task priority!" });
    }
    const deletedTaskPriority = await prisma.taskPriority.delete({
      where: { id: id }, // Convert ID to a number if necessary
    });
    res.status(200).json({
      deletedTaskPriority,
      message: "Task priority successfully deleted!",
    });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ error: "Failed to delete task priority" + error.message });
  }
}

async function createTaskDetail(req, res) {
  try {
    const {
      taskStatusId,
      taskPriorityId,
      taskName,
      startDate,
      endDate,
      dueDate,
      departmentId,
      taskAssignee,
      projectId,
      taskDescription,
      taskTag,
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
        .json({ message: "Only admin can create task detail!" });
    }

    // Extract attachFile URLs from uploaded files
    const attachFile =
      req.uploadedFiles?.map((file) => file?.multiImageUrl) || [];
    req.uploadedFiles?.map((file) => file?.multiImageUrl) || [];

    // console.log(attachFile);
    // Validate the task details using TaskDetailSchema
    const taskDetailResult = TaskDetailSchema.safeParse({
      taskStatusId,
      taskPriorityId,
      taskName,
      startDate,
      endDate,
      dueDate,
      departmentId,
      taskAssignee: taskAssignee || [],
      projectId,
      taskDescription,
      taskTag,
      attachFile, // Set attachFile with URLs
    });

    if (!taskDetailResult.success) {
      // console.log("Task Detail Result", taskDetailResult.error.issues[0]);
      return res.status(400).json({ message: taskDetailResult.error });
    }

    // Create taskDetail and associate taskAssign users
    const taskDetail = await prisma.taskDetail.create({
      data: {
        ...taskDetailResult.data,
        taskAssignee: {
          connect: (taskAssignee || []).map((id) => ({ id })), // Connect assigned users by IDs
        },
        projectId: taskDetailResult.data.projectId,
        departmentId: taskDetailResult.data.departmentId,
        adminId: req.userId,
      },
    });

    const validStaff = await prisma.staffDetails.findMany({
      where: {
        id: { in: taskDetailResult.data.taskAssignee },
      },
      select: { userId: true },
    });

    if (validStaff.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid users found for the provided staff IDs.",
      });
    }

    const validUserIds = validStaff.map((staff) => staff.userId);

    const notifications = validUserIds.map((userId) => ({
      userId,
      title: "New Project Created",
      message: `A new project '${taskName}' has been assigned to you.`,
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Trigger socket event to notify the assignees
    notificationEmitter.emit("newProjectNotification", {
      event: "taskCreated", // Name of the event that the client will listen to
      data: {
        taskId: taskDetail.id,
        taskName: taskDetail.taskName,
        taskDescription: taskDetail.taskDescription,
      },
      recipients: taskAssignee, // Send notification to all assignees
    });

    res
      .status(201)
      .json({ taskDetail, message: "Task detail successfully created!" });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      res
        .status(500)
        .json({ error: "Failed to create new task detail: " + error.message });
    }
  }
}

async function getAllTaskDetail(req, res) {
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
        .json({ message: "Only admin can fetch all task details!" });
    }
    const taskDetail = await prisma.taskDetail.findMany({
      where: { adminId: req.userId },
      include: {
        taskAssignee: true,
        department: true,
        Project: true,
        taskPriority: true,
        taskStatus: true,
      },
    });
    res
      .status(200)
      .json({ taskDetail, message: "Task details successfully retrieved!" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch task detail" + error.message });
  }
}

async function deleteTaskDetail(req, res) {
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
      .json({ message: "Only admin can delete task detail!" });
  }
  try {
    // Check if the task exists before attempting to delete
    const taskDetail = await prisma.taskDetail.findUnique({
      where: { id },
    });

    if (!taskDetail) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Delete the task detail
    await prisma.taskDetail.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ taskDetail, message: "Task detail successfully deleted!" });
  } catch (error) {
    // console.log(error);
    res
      .status(500)
      .json({ error: "Failed to delete task detail" + error.message });
  }
}

async function updateTaskDetail(req, res) {
  try {
    const { id } = req.params; // Extract taskDetail ID from the URL params
    const {
      taskStatusId,
      taskPriorityId,
      taskName,
      startDate,
      endDate,
      dueDate,
      departmentId,
      roleId,
      taskAssignee,
      projectId,
      taskDescription,
      taskTag,
    } = req.body;
    // const attachFile = req.file ? req.savedFilename : null; // Check if a new file is uploaded
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
        .json({ message: "Only admin can update task detail!" });
    }

    // Extract attachFile URLs from uploaded files
    const attachFile =
      req.uploadedFiles?.map((file) => file?.multiImageUrl) || [];

    // Validate the input data using Zod schema
    const taskDetailResult = TaskDetailSchema.safeParse({
      taskStatusId,
      taskPriorityId,
      taskName,
      startDate,
      endDate,
      dueDate,
      departmentId,
      roleId,
      taskAssignee,
      projectId,
      taskDescription,
      taskTag,
      attachFile,
    });
    // console.log(taskDetailResult);

    if (!taskDetailResult.success) {
      return res
        .status(400)
        .json({ message: taskDetailResult.error.issues[0].message });
    }

    // Check if the task exists before updating
    const existingTaskDetail = await prisma.taskDetail.findUnique({
      where: { id },
    });

    if (!existingTaskDetail) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Update the task detail
    const updatedTaskDetail = await prisma.taskDetail.update({
      where: { id },
      data: {
        ...taskDetailResult.data,
        taskAssignee: {
          set: taskAssignee.map((id) => ({ id })), // Connect assigned users by IDs
        },
      },
    });
    // console.log(updatedTaskDetail);

    res.status(200).json({
      updatedTaskDetail,
      message: "Task detail successfully updated!",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      // console.log(error);
      res
        .status(500)
        .json({ error: "Failed to update task detail" + error.message });
    }
  }
}

async function getTaskDetailById(req, res) {
  try {
    const { id } = req.params; // Extract the taskDetail ID from the URL params

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
        .json({ message: "Only admin can fetch task detail by id!" });
    }

    // Find the task detail by ID
    const taskDetail = await prisma.taskDetail.findUnique({
      where: { id },
    });

    // If the task detail is not found, return a 404 error
    if (!taskDetail) {
      return res.status(404).json({ message: "Task detail not found" });
    }

    // If task detail is found, return it
    res
      .status(200)
      .json({ taskDetail, message: "Task detail successfully retrieved!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch task detail" + error.message });
  }
}

// Search Data by task priority Name

const searchTaskDetailByName = async (req, res) => {
  try {
    const { taskPriorityName } = req.query;
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
        .json({ message: "Only admin can search task detail by name!" });
    }
    const taskDetail = await prisma.taskPriority.findMany({
      where: {
        adminId: req.userId,
        taskPriorityName: {
          contains: taskPriorityName,
          mode: "insensitive",
        },
      },
    });
    res
      .status(200)
      .json({ taskDetail, message: "Task detail successfully retrieved!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error!" + error.message,
    });
  }
};

// Search Task Status By taskStatusName -----------------------------

const searchTaskStatusByName = async (req, res) => {
  try {
    const { name, page = 1, limit = 10 } = req.query;

    // Validate inputs
    if (!name) {
      return res
        .status(400)
        .json({ message: "Query parameter 'taskStatusName' is required." });
    }

    const offset = (Number(page) - 1) * Number(limit);

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
        .json({ message: "Only admin can search task status by name!" });
    }

    // Query with pagination
    const taskStatus = await prisma.taskStatus.findMany({
      where: {
        adminId: req.userId,

        taskStatusName: {
          contains: name,
          mode: "insensitive", // Makes the search case-insensitive
        },
      },
      skip: offset, // Skip items for the current page
      take: Number(limit), // Limit the number of items per page
    });

    // Count total records for pagination metadata
    const totalRecords = await prisma.taskStatus.count({
      where: {
        adminId: req.userId,

        taskStatusName: {
          contains: name,
          mode: "insensitive",
        },
      },
    });

    if (taskStatus.length === 0) {
      return res
        .status(404)
        .json({ data: [], message: "No task statuses found!" });
    }

    // Pagination metadata
    const totalPages = Math.ceil(totalRecords / Number(limit));
    const pagination = {
      currentPage: Number(page),
      totalPages,
      totalRecords,
      limit: Number(limit),
    };

    res.status(200).json({
      data: taskStatus,
      pagination,
      message: "Task statuses successfully retrieved!",
    });
  } catch (error) {
    console.error("Error while fetching task statuses:", error.message); // Debug log for errors
    res.status(500).json({
      status: false,
      message: "Internal Server Error! " + error.message,
    });
  }
};

const searchTaskPriorityByName = async (req, res) => {
  try {
    const { name, page = 1, limit = 10 } = req.query;

    // Validate inputs
    if (!name) {
      return res
        .status(400)
        .json({ message: "Query parameter 'taskPriorityName' is required." });
    }

    const offset = (Number(page) - 1) * Number(limit);

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
        .json({ message: "Only admin can search task priority by name!" });
    }

    // Query with pagination
    const taskPriority = await prisma.taskPriority.findMany({
      where: {
        taskPriorityName: {
          contains: name,
          mode: "insensitive", // Makes the search case-insensitive
        },
        adminId: req.userId,
      },
      skip: offset, // Skip items for the current page
      take: Number(limit), // Limit the number of items per page
    });

    // Count total records for pagination metadata
    const totalRecords = await prisma.taskPriority.count({
      where: {
        taskPriorityName: {
          contains: name,
          mode: "insensitive",
        },
        adminId: req.userId,
      },
    });

    const totalPages = Math.ceil(totalRecords / Number(limit));
    const pagination = {
      currentPage: Number(page),
      totalPages,
      totalRecords,
      limit: Number(limit),
    };

    res.status(200).json({
      data: taskPriority,
      pagination,
      message: "Task priorities successfully retrieved!",
    });
  } catch (error) {
    console.error("Error while fetching task priorities:", error.message); // Debug log for errors
    res.status(500).json({
      status: false,
      message: "Internal Server Error! " + error.message,
    });
  }
};

const deleteTaskDetailInBulk = async (req, res) => {
  try {
    const { ids } = req.body; // Get IDs from the request body
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
        .json({ message: "Only admin can delete task detail in bulk!" });
    }

    // // Check if IDs are provided and valid
    // if (!Array.isArray(ids) || ids.length === 0) {
    //   return res.status(400).json({ message: "Please provide a valid array of IDs!" });
    // }

    await prisma.taskDetail.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.status(200).json({ message: "Task details successfully deleted!" });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

// get all task count

const getAllTaskCount = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });
    // console.log("Admin Data" + admin);
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!",
      });
    }

    if (admin.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can get the task count!",
      });
    }

    const taskCount = await prisma.taskDetail.count({
      where: {
        adminId: req.userId,
      },
    });

    res.status(200).json({
      message: "Successfully fetched task count",
      taskCount,
    });
  } catch (error) {
    console.error("Error fetching task count:", error.message);
    res.status(500).json({
      message: "Failed to get task count",
      error: error.message,
    });
  }
};

module.exports = {
  createTaskStatus,
  getAllTaskStatus,
  getAllTaskPriority,
  createTaskDetail,
  getAllTaskDetail,
  deleteTaskDetail,
  updateTaskDetail,
  getTaskDetailById,
  updateTaskStatus,
  searchTaskDetailByName,
  searchTaskStatusByName,
  updateTaskPriority,
  searchTaskPriorityByName,
  createTaskPriority,
  deleteTaskStatus,
  deleteTaskPriority,
  deleteTaskDetailInBulk,
  getAllTaskCount,
};
