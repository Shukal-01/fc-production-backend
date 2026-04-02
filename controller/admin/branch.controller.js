const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ZodError } = require("zod");
const { BranchSchema } = require("../../utils/validations");

const createBranch = async (req, res) => {
  try {
    const { branchName } = req.body;

    const branchResult = BranchSchema.safeParse({
      branchName,
    });
    if (!branchResult.success) {
      return res.status(400).json({
        status: false,
        message: branchResult.error.issues[0].message,
      });
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
      return res.status(400).json({ message: "Only admin can create branch!" });
    }
    const branch = await prisma.branch.create({
      data: { ...branchResult.data, adminId: req.userId },
    });
    res.status(201).json(branch);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: error.message });
    } else {
      // console.log(error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  }
};

const getAllBranch = async (req, res) => {
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
      return res.status(400).json({ message: "Only admin can get branches!" });
    }
    const branches = await prisma.branch.findMany({
      where: { adminId: req.userId },
      include: {
        StaffDetails: true,
      },
    });
    res.status(200).json(branches);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};

const deleteBranch = async (req, res) => {
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
      return res.status(400).json({ message: "Only admin can delete branch!" });
    }
    const deletedBranch = await prisma.branch.delete({
      where: { id: id },
    });
    res
      .status(200)
      .json({ message: "Branch deleted successfully", deletedBranch });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Failed to delete branch" });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Branch id is required",
      });
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
      return res.status(400).json({ message: "Only admin can update branch!" });
    }
    const { branchName } = req.body;

    const branchResult = BranchSchema.safeParse({
      branchName,
    });

    if (!branchResult.success) {
      return res.status(400).json({
        status: false,
        message: branchResult.error.issues[0].message,
      });
    }

    const updatedBranch = await prisma.branch.update({
      where: { id: id },
      data: { branchName: branchResult.data.branchName },
    });

    res
      .status(200)
      .json({ message: "Branch updated successfully", updatedBranch });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Failed to update branch" });
  }
};

// Branch Search API's Create

const searchBranch = async (req, res) => {
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
      return res.status(400).json({ message: "Only admin can search branch!" });
    }
    const { branchName } = req.query;
    const branches = await prisma.branch.findMany({
      where: {
        adminId: req.userId,
        branchName: {
          contains: branchName,
          mode: "insensitive",
        },
      },
    });
    res.status(200).json(branches);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Failed to search branch" });
  }
};

// count branch API

const branchCount = async (req, res) => {
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
      return res.status(400).json({ message: "Only admin can count branch!" });
    }
    const count = await prisma.branch.count({
      where: {
        adminId: req.userId,
      },
    });
    res
      .status(200)
      .json({ message: "Successfully fetched branch count", count });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Failed to count branch" });
  }
};

module.exports = {
  createBranch,
  getAllBranch,
  deleteBranch,
  updateBranch,
  searchBranch,
  branchCount,
};
