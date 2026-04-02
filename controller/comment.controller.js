const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { commentSchema } = require("../utils/validations");

// Create Comment API
const createComment = async (req, res) => {
  try {
    // Validate incoming request body using Zod
    const validationResult = commentSchema.safeParse(req.body);

    // Handle validation errors
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.errors,
      });
    }

    // Extract validated data
    const validatedData = validationResult.data;

    // Debugging log (optional)
    // console.log("Validated Data:", validatedData);

    // Create a comment in the database
    const result = await prisma.comment.create({
      data: validatedData,
    });

    // Debugging log (optional)
    // console.log("Created Comment:", result);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Comment created successfully",
      data: result,
    });
  } catch (error) {
    // Handle internal server errors
    console.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all comments API
const getAllComments = async (req, res) => {
  try {
    // Fetch all comments from the database
    const comments = await prisma.comment.findMany();

    // Debugging log (optional)
    // console.log("All Comments:", comments);

    // Send success response
    res.status(200).json({
      success: true,
      message: "All comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    // Handle internal server errors
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// delete comment API
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedComment = await prisma.comment.delete({
      where: { id },
    });
    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: deletedComment,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get By ID comment API
const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({
      where: { id },
    });
    res.status(200).json({
      success: true,
      message: "Comment fetched successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error fetching comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update comment by id
const updateComment = async (req, res) => {
  try {
    // Validate incoming request body using Zod
    const validationResult = commentSchema.safeParse(req.body);

    // Handle validation errors
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.errors,
      });
    }

    // Extract validated data
    const validatedData = validationResult.data;

    // Debugging log (optional)
    // console.log("Validated Data:", validatedData);

    // Create a comment in the database
    const result = await prisma.comment.update({
      data: validatedData,
    });

    // Debugging log (optional)
    // console.log("Update Comment:", result);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Comment Update successfully",
      data: result,
    });
  } catch (error) {
    // Handle internal server errors
    console.error("Error Update comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all comment count

// const getAllCommentsCount = async (req, res) => {
//   try {
//     const admin = await prisma.user.findUnique({
//       where: {
//         id: req.userId,
//       },
//     });
//     console.log("Admin Data" + admin);
//     if (!admin) {
//       return res.status(404).json({
//         message: "Admin not found!",
//       });
//     }

//     if (admin.role !== "ADMIN") {
//       return res.status(403).json({
//         message: "Only admin can view comments count!",
//       });
//     }

//     const commentCount = await prisma.comment.count({
//       where: {
//         adminId: req.userId,
//       },
//     });

//     res.status(200).json({
//       message: "Successfully fetched comment count",
//       commentCount,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch comment count" });
//   }
// };

module.exports = {
  createComment,
  getAllComments,
  deleteComment,
  getCommentById,
  updateComment,
  //   getAllCommentsCount,
};
