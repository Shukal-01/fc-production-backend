const { PrismaClient } = require("@prisma/client");
const { ZodError } = require("zod");
const { FineSchema } = require("../../../../utils/validations.js");
const prisma = new PrismaClient();

const addFineData = async (req, res) => {
  const {
    staffId,
    lateEntryFineHoursTime,
    excessBreakFineHoursTime,
    earlyOutFineHoursTime,
    lateEntryFineAmount,
    lateEntryAmount,
    excessBreakFineAmount,
    excessBreakAmount,
    earlyOutFineAmount,
    earlyOutAmount,
    totalAmount,
    shiftIds,
    punchRecordId,
  } = req.body;

  const validate = FineSchema.safeParse({
    staffId,
    lateEntryFineAmount,
    lateEntryAmount,
    excessBreakFineAmount,
    excessBreakAmount,
    earlyOutFineAmount,
    earlyOutAmount,
    totalAmount,
    shiftIds,
  });

  if (!validate.success) {
    // console.log("Error:", validate.error.issues[0]);
    return res.status(400).json({
      error: validate.error.issues[0].message,
    });
  }

  // console.log("Fine data:", req.body);

  // Validate input
  if (!staffId && !punchRecordId) {
    return res
      .status(400)
      .json({ error: "staffId and punchRecordId are required." });
  }

  try {
    let punchRecord = await prisma.punchRecords.findFirst({
      where: { staffId, id: punchRecordId },
    });

    if (!punchRecord) {
      punchRecord = await prisma.punchRecords.create({
        data: { staffId, status: "ABSENT" },
      });
    }

    const existingFine = await prisma.fine.findFirst({
      where: { punchRecordId: punchRecord.id },
    });

    if (existingFine) {
      const fine = await prisma.fine.update({
        where: { id: existingFine.id },
        data: {
          lateEntryFineHoursTime,
          excessBreakFineHoursTime,
          earlyOutFineHoursTime,
          lateEntryFineAmount,
          lateEntryAmount,
          excessBreakFineAmount,
          excessBreakAmount,
          earlyOutFineAmount,
          earlyOutAmount,
          totalAmount: parseFloat(totalAmount),
        },
      });

      return res
        .status(200)
        .json({ message: "Fine updated successfully", fine });
    }

    // Create new fine
    const fine = await prisma.fine.create({
      data: {
        staff: {
          connect: {
            id: staffId,
          },
        },
        lateEntryFineHoursTime,
        excessBreakFineHoursTime,
        earlyOutFineHoursTime,
        lateEntryFineAmount,
        lateEntryAmount,
        excessBreakFineAmount,
        excessBreakAmount,
        earlyOutFineAmount,
        earlyOutAmount,
        totalAmount: parseFloat(totalAmount),
        shiftDetails: {
          connect: {
            id: shiftIds,
          },
        },
        punchRecord: {
          connect: {
            id: punchRecord.id,
          },
        },
      },
    });

    return res.status(201).json({ message: "Fine created successfully", fine });
  } catch (error) {
    console.error("Error adding or updating fine:", error.message);
    res
      .status(500)
      .json({ message: "Fine not added or updated", error: error.message });
  }
};

const getFinesByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const fineDate = new Date(date);

    if (isNaN(fineDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const fines = await prisma.fine.findMany({
      where: {
        createdAt: {
          gte: fineDate,
          lt: new Date(fineDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        staff: {
          include: {
            User: true,
          },
        },
        shiftDetails: true,
        punchRecord: {
          include: {
            punchIn: true,
            punchOut: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Fines fetched successfully",
      fines: fines,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching the fines" });
  }
};

const updateFine = async (req, res) => {
  const { id } = req.params;
  const {
    lateEntryFineHoursTime,
    excessBreakFineHoursTime,
    earlyOutFineHoursTime,
    lateEntryFineAmount,
    lateEntryAmount,
    excessBreakFineAmount,
    excessBreakAmount,
    earlyOutFineAmount,
    earlyOutAmount,
    totalAmount,
    shiftIds,
  } = req.body;

  try {
    const validate = FineSchema.omit({ staffId: true }).safeParse({
      lateEntryFineAmount,
      lateEntryAmount,
      excessBreakFineAmount,
      excessBreakAmount,
      earlyOutFineAmount,
      earlyOutAmount,
      totalAmount,
      shiftIds,
    });

    if (!validate.success) {
      return res.status(400).json({
        error: validate.error.errors[0].message,
      });
    }
    const fine = await prisma.fine.update({
      where: {
        id: id,
      },
      data: {
        lateEntryFineHoursTime,
        excessBreakFineHoursTime,
        earlyOutFineHoursTime,
        lateEntryFineAmount,
        lateEntryAmount,
        excessBreakFineAmount,
        excessBreakAmount,
        earlyOutFineAmount,
        earlyOutAmount,
        totalAmount,
        shiftIds,
      },
    });

    res.status(200).json(fine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update fine" });
  }
};


const updateMultipleFineData = async (req, res) => {
  try {
    const { fineUpdates } = req.body;

    // Validate input
    if (!Array.isArray(fineUpdates) || fineUpdates.length === 0) {
      return res
        .status(400)
        .json({ error: "Please provide valid fine updates" });
    }

    const updatePromises = fineUpdates.map(async (fine) => {
      // Check if the punchRecordId exists
      const existingPunchRecord = await prisma.punchRecords.findFirst({
        where: { id: fine.punchRecordId },
      });

      if (!existingPunchRecord) {
        throw new Error(
          `PunchRecord with ID ${fine.punchRecordId} does not exist.`
        );
      }

      // Update fine record
      return prisma.fine.update({
        where: { id: fine.id },
        data: {
          excessBreakFineHoursTime: fine.excessBreakFineHoursTime,
          earlyOutFineHoursTime: fine.earlyOutFineHoursTime,
          lateEntryFineHoursTime: fine.lateEntryFineHoursTime,
          lateEntryFineAmount: fine.lateEntryFineAmount,
          lateEntryAmount: fine.lateEntryAmount,
          excessBreakFineAmount: fine.excessBreakFineAmount,
          excessBreakAmount: fine.excessBreakAmount,
          earlyOutFineAmount: fine.earlyOutFineAmount,
          earlyOutAmount: fine.earlyOutAmount,
          totalAmount: fine.totalAmount,
          shiftIds: JSON.stringify(fine.shiftIds),
        },
      });
    });

    // Wait for all updates to complete
    const updatedFines = await Promise.all(updatePromises);

    res
      .status(200)
      .json({ message: "Fines updated successfully", data: updatedFines });
  } catch (error) {
    console.error("Error updating fine data:", error.message);

    // Send specific error message if the punchRecordId is invalid
    if (error.message.includes("PunchRecord")) {
      return res.status(400).json({ error: error.message });
    }

    // Send generic error response
    res
      .status(500)
      .json({ error: "Internal server error. Please try again later." });
  }
};

const getAllFine = async (req, res) => {
  try {
    const fine = await prisma.fine.findMany();
    return res.status(200).json({ fine });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching fines" });
  }
};

module.exports = {
  addFineData,
  getFinesByDate,
  getAllFine,
  updateFine,
  updateMultipleFineData,
};
