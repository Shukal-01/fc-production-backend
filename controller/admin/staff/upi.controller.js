const { PrismaClient } = require("@prisma/client");
const { ZodError } = require("zod");
const prisma = new PrismaClient();

const createOrUpdateUpiDetails = async (req, res) => {
  const { staffId, UpiId } = req.body;

  try {
    const existingUpiDetails = await prisma.upiDetails.findUnique({
      where: { staffId },
    });

    let upiDetails;

    if (existingUpiDetails) {
      upiDetails = await prisma.upiDetails.update({
        where: { staffId },
        data: { UpiId },
      });
    } else {
      upiDetails = await prisma.upiDetails.create({
        data: { UpiId, staffId },
      });
    }

    res.status(200).json({
      message: "UPI details saved successfully",
      data: upiDetails,
    });
  } catch (error) {
    console.error("Error saving UPI details:", error);
    res.status(500).json({
      message: "Failed to save UPI details",
      error: error.message,
    });
  }
};

const getUpiDetailsByStaffId = async (req, res) => {
  const { staffId } = req.params;

  try {
    const upiDetails = await prisma.upiDetails.findUnique({
      where: { staffId },
    });

    if (!upiDetails) {
      return res.status(404).json({
        message: "UPI details not found for the given staff ID",
      });
    }

    res.status(200).json({
      message: "UPI details fetched successfully",
      data: upiDetails,
    });
  } catch (error) {
    console.error("Error fetching UPI details:", error);
    res.status(500).json({
      message: "Failed to fetch UPI details",
      error: error.message,
    });
  }
};

const deleteUpiDetailsByStaffId = async (req, res) => {
  const { staffId } = req.params;

  try {
    const deletedUpiDetails = await prisma.upiDetails.delete({
      where: { staffId },
    });

    res.status(200).json({
      message: "UPI details deleted successfully",
      data: deletedUpiDetails,
    });
  } catch (error) {
    console.error("Error deleting UPI details:", error);
    res.status(500).json({
      message: "Failed to delete UPI details",
      error: error.message,
    });
  }
};

module.exports = {
  createOrUpdateUpiDetails,
  getUpiDetailsByStaffId,
  deleteUpiDetailsByStaffId,
};
