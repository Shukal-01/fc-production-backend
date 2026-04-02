const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new Incentive
exports.createIncentive = async (req, res) => {
  try {
    const { staffId, incentiveTypeId, amount, date, note, salaryId } = req.body;

    const adminId = req.userId;

    if (!salaryId)
      return res.status(400).json({ error: "Salary ID is required." });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    if (!admin)
      return res
        .status(404)
        .json({ error: "Only admin can create incentive." });

    const newIncentive = await prisma.incentive.create({
      data: {
        staffId,
        incentiveTypeId,
        amount,
        date: date ? new Date(date) : undefined,
        note,
        adminId,
        salaryId,
      },
    });

    res.status(201).json({ success: true, data: newIncentive });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Incentives
exports.getAllIncentives = async (req, res) => {
  try {
    const incentives = await prisma.incentive.findMany({
      include: {
        admin: true,
        staff: true,
        IncentiveType: true,
      },
    });

    res.status(200).json({ success: true, data: incentives });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get an Incentive by ID
exports.getIncentiveById = async (req, res) => {
  try {
    const { id } = req.params;

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        admin: true,
        staff: true,
        IncentiveType: true,
      },
    });

    if (!incentive) {
      return res
        .status(404)
        .json({ success: false, message: "Incentive not found" });
    }

    res.status(200).json({ success: true, data: incentive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an Incentive
exports.updateIncentive = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, note } = req.body;

    const incentive = await prisma.incentive.findUnique({ where: { id } });
    if (!incentive) {
      return res
        .status(404)
        .json({ success: false, message: "Incentive record not found" });
    }

    const updatedIncentive = await prisma.incentive.update({
      where: { id },
      data: {
        amount,
        date: date ? new Date(date) : undefined,
        note,
      },
    });

    res.status(200).json({ success: true, data: updatedIncentive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an Incentive
exports.deleteIncentive = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.incentive.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ success: true, message: "Incentive deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
