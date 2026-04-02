const express = require("express");
const multer = require("multer");
const upload = require("../../../middleware/upload.js");
const { PrismaClient } = require("@prisma/client");
const { projectFilesSchema } = require("../../../utils/validations.js");

const prisma = new PrismaClient();
const app = express();

// Add Project Files Query
const addProjectFiles = async (req, res) => {
  const { projectId, ...rest } = req.body;

  const file_name = req.imageUrl;
  const file_type = req.file.mimetype;
  const date_uploaded = new Date();

  try {
    const validation = projectFilesSchema.safeParse({
      ...rest,
      visible_to_customer:
        rest.visible_to_customer === "false" || rest.visible_to_customer === ""
          ? false
          : true,
    });
    if (!validation.success) {
      return res
        .status(400)
        .json({ status: false, message: validation.error.issues[0].message });
    }
    const {
      projectId,
      last_activity,
      total_comments,
      visible_to_customer,
      uploaded_by,
    } = validation.data;
    const newFilesData = await prisma.projectFiles.create({
      data: {
        projectId,
        file_name: file_name,
        file_type: file_type,
        last_activity: last_activity || "",
        total_comments: total_comments || "",
        visible_to_customer: visible_to_customer || false,
        uploaded_by: uploaded_by || "",
        date_uploaded: date_uploaded,
      },
    });

    return res
      .status(201)
      .json({ msg: "File uploaded successfully", file: newFilesData });
  } catch (error) {
    console.error("Failed to creating project file:", error);
    return res
      .status(500)
      .json({ msg: "Failed to creating project file", error: error.message });
  }
};

// Get All Project Files
const getAllProjectFiles = async (req, res) => {
  const ProjectsFiles = await prisma.projectFiles.findMany({});
  try {
    return res.status(200).json({
      message: "Project files fetched successfully",
      data: ProjectsFiles,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "failed to get project files" + error.message });
  }
};

// Update Project Files
const updateProjectFiles = async (req, res) => {
  const { id } = req.params;
  const { projectId, ...rest } = req.body;
  try {
    const file_name = req.imageUrl;
    const file_type = req.file.mimetype;
    const date_uploaded = new Date();
    const validation = projectFilesSchema.safeParse({
      ...rest,
      visible_to_customer:
        rest.visible_to_customer === "false" || rest.visible_to_customer === ""
          ? false
          : true,
    });
    if (!validation.success) {
      return res
        .status(400)
        .json({ status: false, message: validation.error.issues[0].message });
    }
    const {
      projectId,
      last_activity,
      total_comments,
      visible_to_customer,
      uploaded_by,
    } = validation.data;
    const updatedProjects = await prisma.projectFiles.update({
      where: {
        id: id,
      },
      data: {
        projectId,
        file_name: file_name,
        file_type: file_type,
        last_activity: last_activity || "",
        total_comments: total_comments || "",
        visible_to_customer: visible_to_customer || false,
        uploaded_by: uploaded_by || "",
        date_uploaded: date_uploaded,
      },
    });
    return res.status(200).json({
      message: "Project files updated successfully!",
      data: updatedProjects,
    });
  } catch (error) {
    console.error("Failed updating project:", error.message);
    return res.status(400).json({ message: "Project update failed!" });
  }
};

// delete projects files
const deleteProjectFiles = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProjectFiles = await prisma.projectFiles.delete({
      where: {
        id: id,
      },
    });
    return res.status(200).json({
      message: "Project files deleted successfully!",
      data: deletedProjectFiles,
    });
  } catch (error) {
    if (error.code) {
      return res
        .status(404)
        .json({ message: "Project files not found!" + error.message });
    }
  }
};

// get project files count
// Get project files count
const getProjectFilesCount = async (req, res) => {
  try {
    // Fetch admin details from the database
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    // Check if admin exists
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!",
      });
    }

    // Verify if the user has admin privileges
    if (admin.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can get the project files count!",
      });
    }

    // Fetch the count of project files
    const projectFilesCount = await prisma.projectFiles.count();

    // Send a success response with the count
    return res.status(200).json({
      message: "Project files count fetched successfully",
      data: projectFilesCount,
    });
  } catch (error) {
    // Handle errors and send a server error response
    console.error("Error fetching project files count:", error.message);
    return res.status(500).json({
      message: "Failed to get project files count",
      error: error.message,
    });
  }
};

module.exports = {
  addProjectFiles,
  getAllProjectFiles,
  updateProjectFiles,
  deleteProjectFiles,
  getProjectFilesCount,
};
