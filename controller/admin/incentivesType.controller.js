const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new IncentiveType
exports.createIncentiveType = async (req, res) => {
  try {
    const { name } = req.body;
    const { userId: adminId } = req;

    if (!adminId)
      return res.status(403).json({ error: "Unauthorized access." });

    if (!name) return res.status(400).json({ error: "Name is required." });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ error: "Admin not found." });

    const newIncentiveType = await prisma.incentiveType.create({
      data: { name, adminId },
    });

    res.status(201).json({ success: true, data: newIncentiveType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all IncentiveTypes
exports.getAllIncentiveTypes = async (req, res) => {
  try {
    const { userId: adminId } = req;

    const incentiveTypes = await prisma.incentiveType.findMany({
      where: { adminId: adminId },
      include: { admin: true },
    });

    res.status(200).json({ success: true, data: incentiveTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get an IncentiveType by ID
exports.getIncentiveTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const incentiveType = await prisma.incentiveType.findUnique({
      where: { id },
      include: { admin: true, Incentive: true },
    });

    if (!incentiveType) {
      return res.status(404).json({ success: false, message: "Not Found" });
    }

    res.status(200).json({ success: true, data: incentiveType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an IncentiveType
exports.updateIncentiveType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updatedIncentiveType = await prisma.incentiveType.update({
      where: { id },
      data: { name },
    });

    res.status(200).json({ success: true, data: updatedIncentiveType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an IncentiveType
exports.deleteIncentiveType = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.incentiveType.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
