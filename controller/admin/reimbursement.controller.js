const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all reimbursements
exports.getAllReimbursements = async (req, res) => {
  try {
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "You are not authorized to access this resource." });
    }
    const reimbursements = await prisma.reimbursement.findMany({
      where: { adminId: req.userId },
      include: { admin: true, salary: true, staff: true },
    });
    res.status(200).json(reimbursements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reimbursements." });
  }
};

// Get a reimbursement by ID
exports.getReimbursementById = async (req, res) => {
  try {
    const { id } = req.params;
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
      include: { admin: true, salary: true, staff: true },
    });
    if (!reimbursement) {
      return res.status(404).json({ error: "Reimbursement not found." });
    }
    res.status(200).json(reimbursement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reimbursement." });
  }
};

// Create a new reimbursement
exports.createReimbursement = async (req, res) => {
  try {
    const { staffId, amount, date, note, salaryId } = req.body;
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admin can create reimbursement." });
    }
    console.log(date);
    const reimbursement = await prisma.reimbursement.create({
      data: { staffId, amount, date: new Date(date), note, adminId, salaryId },
    });
    res.status(201).json(reimbursement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create reimbursement." });
  }
};

// Update a reimbursement
exports.updateReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, amount, date, note, salaryId } = req.body;
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admin can create reimbursement." });
    }
    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: { staffId, amount, date: new Date(date), note, salaryId },
    });
    res.status(200).json(updatedReimbursement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update reimbursement." });
  }
};

// Delete a reimbursement
exports.deleteReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admin can create reimbursement." });
    }
    await prisma.reimbursement.delete({ where: { id } });
    res.status(200).json({ message: "Reimbursement deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete reimbursement." });
  }
};
