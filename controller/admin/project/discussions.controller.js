const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { discussionsSchema } = require("../../../utils/validations.js");

const app = express();
const prisma = new PrismaClient();

// Add Discussion
const addDiscussionDetails = async (req, res) => {
  const validation = discussionsSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ status: false, message: validation.error.issues[0].message });
  }

  const {
    projectId,
    subject,
    description,
    last_activity,
    visible_to_customer,
    CommentId,
  } = validation.data;

  try {
    const newDiscussion = await prisma.discussion.create({
      data: {
        projectId,
        subject,
        description,
        last_activity,
        visible_to_customer: visible_to_customer ?? false,
        CommentId,
      },
    });

    return res.status(200).json({
      message: "Discussion Created Successfully!",
      data: newDiscussion,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create discussion!", error: error.message });
  }
};

// Get Discussions
const getDiscussions = async (req, res) => {
  const { id } = req.params;

  try {
    const getAllDiscussions = await prisma.discussion.findMany({
      where: id ? { id } : {},
    });
    return res.status(200).json({
      message: "Discussions fetched successfully",
      data: getAllDiscussions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to get discussions!" + error.message });
  }
};

// Delete Discussions By Id
const deleteDiscussions = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteData = await prisma.discussion.delete({
      where: {
        id: id,
      },
    });
    res.status(200).json({ message: "Discussion delete successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "failed to delete discussion!" + error.message });
  }
};

// update discussions
const updateDiscussions = async (req, res) => {
  const { id } = req.params;
  try {
    const validation = discussionsSchema.safeParse(req.body);

    if (!validation.success) {
      return res
        .status(400)
        .json({ status: false, message: validation.error.issues[0].message });
    }
    const {
      projectId,
      subject,
      discription,
      last_activity,
      total_comments,
      visible_to_customer,
    } = validation.data;
    const updateData = await prisma.discussion.update({
      where: {
        id: id,
      },
      data: {
        projectId,
        subject,
        discription,
        last_activity,
        total_comments,
        visible_to_customer: visible_to_customer || false,
      },
    });
    return res.json({
      message: "Discussion updated successfully!",
      data: updateData,
    });
  } catch (error) {
    if (error.code) {
      return res
        .status(400)
        .json({ message: "Discussion not found!" + error.message });
    }
  }
};

module.exports = {
  addDiscussionDetails,
  getDiscussions,
  deleteDiscussions,
  updateDiscussions,
};
