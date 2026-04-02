const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ZodError } = require("zod");
const { StartBreakSchema, EndBreakSchema } = require("../../utils/validations");

const getBreakRecordByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ error: "Date is required in the format YYYY-MM-DD" });
    }

    const providedDate = new Date(date);
    if (isNaN(providedDate)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const user = await prisma.user.findFirst({
      where: { id: req.userId, role: "STAFF" },
      include: { staffDetails: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    // console.log(user);
    const staffId = user.staffDetails.id;

    // Parse date from DD/MM/YYYY format
    const [day, month, year] = date.split("/");
    if (!day || !month || !year) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use DD/MM/YYYY" });
    }

    const startOfDayUTC = new Date(
      `${year}-${month}-${day}T00:00:00+05:30`
    ).toISOString();
    const endOfDayUTC = new Date(
      `${year}-${month}-${day}T23:59:59+05:30`
    ).toISOString();

    const breakRecord = await prisma.breakRecord.findFirst({
      where: {
        staffId,
        breakDate: {
          gte: startOfDayUTC,
          lte: endOfDayUTC,
        },
      },
    });

    if (!breakRecord) {
      return res
        .status(404)
        .json({ message: "No break record found for the given date." });
    }

    return res.status(200).json({
      message: "Break record found.",
      breakRecord: {
        ...breakRecord,
        breakDate: new Date(breakRecord.breakDate).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching break record:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createStartBreak = async (req, res) => {
  try {
    const photoUrl = req.imageUrl || "null";
    const validation = StartBreakSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: false,
        message: validation.error.issues[0].message,
      });
    }

    const { breakMethod, biometricData, qrCodeValue, location } =
      validation.data;

    // Find the user and include staff details
    const user = await prisma.user.findFirst({
      where: { id: req.userId, role: "STAFF" },
      include: { staffDetails: true },
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const start = StartBreakSchema.parse({
      staffId: user.staffDetails.id,
      breakMethod,
      biometricData,
      qrCodeValue,
      photoUrl,
      location,
    });

    // Get India timezone dates
    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentDayStart = new Date(indiaTime);
    currentDayStart.setHours(0, 0, 0, 0); // Start of the day
    const currentDayEnd = new Date(indiaTime);
    currentDayEnd.setHours(23, 59, 59, 999); // End of the day

    // Validate the date objects
    if (isNaN(currentDayStart) || isNaN(currentDayEnd)) {
      throw new Error("Invalid India timezone conversion for date range.");
    }

    // Find the latest startBreak entry for today
    const latestStartBreak = await prisma.startBreak.findFirst({
      where: {
        staffId: start.staffId,
        startBreakTime: {
          gte: currentDayStart,
          lte: currentDayEnd,
        },
      },
      orderBy: {
        startBreakTime: "desc",
      },
    });

    if (latestStartBreak) {
      const correspondingEndBreak = await prisma.endBreak.findFirst({
        where: {
          staffId: start.staffId,
          endBreakTime: {
            gte: latestStartBreak.startBreakTime,
          },
        },
        orderBy: {
          endBreakTime: "desc",
        },
      });

      if (!correspondingEndBreak) {
        return res.status(400).json({
          error:
            "A startBreak already exists without a corresponding endBreak. Complete the current break before starting a new one.",
        });
      }
    }

    let breakData = { breakMethod, location };

    if (breakMethod === "PHOTOCLICK") {
      breakData = { ...breakData, photoUrl };
    } else if (breakMethod === "QRSCAN") {
      breakData = { ...breakData, qrCodeValue };
    } else if (breakMethod === "BIOMETRIC") {
      breakData = { ...breakData, biometricData };
    }

    // Start a Prisma transaction
    const result = await prisma.$transaction(async (prisma) => {
      const startBreak = await prisma.startBreak.create({
        data: {
          breakMethod: breakMethod || "PHOTOCLICK",
          ...breakData,
          location,
          staffId: start.staffId,
        },
      });

      const indiaTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const indianTime = new Date(indiaTime);

      const breakRecord = await prisma.breakRecord.create({
        data: {
          staffId: start.staffId,
          startBreakId: startBreak.id,
          breakDate: indianTime,
        },
      });

      return { startBreak, breakRecord };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }

    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

// get break record by staff id

const getBreakRecordByStaffId = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.userId, role: "STAFF" },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const staffId = user.staffDetails;
    // Fetch all endBreaks for the given staffId
    const endBreaks = await prisma.endBreak.findMany({
      where: { staffId: staffId }, // Fetch endBreaks for this staffId
      orderBy: { endBreakTime: "desc" }, // Sort by latest endBreakTime
    });

    if (endBreaks.length === 0) {
      return res
        .status(404)
        .json({ message: "No break records found for this staff ID" });
    }

    // Fetch corresponding startBreaks and merge them
    const breakRecords = await Promise.all(
      endBreaks.map(async (endBreak) => {
        // Find the latest startBreak before this endBreak
        const startBreak = await prisma.startBreak.findFirst({
          where: {
            staffId: staffId,
            startBreakTime: {
              lte: endBreak.endBreakTime, // Must be before or equal to the endBreak time
            },
          },
          orderBy: { startBreakTime: "desc" }, // Get the latest startBreak
        });

        // Combine startBreak and endBreak into a single object
        return {
          // breakDate: endBreak.endBreakTime, // Use endBreak's time for the breakDate
          startBreak: startBreak || null, // Add startBreak if found, else null
          endBreak: endBreak,
        };
      })
    );

    // Return the combined break records as a response
    return res.status(200).json({
      message: "Break Records",
      breakRecords,
    });
  } catch (error) {
    console.error("Error fetching break records:", error);

    // Return an error response for any issues during the process
    return res
      .status(500)
      .json({ message: "Break Records not fetched", error: error.message });
  }
};

async function getAllStartBreaks(req, res) {
  try {
    const breakRecords = await prisma.breakRecord.findMany({
      where: { staffId: req.userId, },
      include: { startBreak: true },
    });
    res.status(200).json(breakRecords?.startBreak);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch startBreaks" });
  }
}

async function getStartBreakByStaffId(req, res) {
  try {
    const { staffId } = req.params;
    const startBreaks = await prisma.startBreak.findMany({
      where: { staffId },
    });
    res.status(200).json(startBreaks);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch startBreaks" });
  }
}

async function createEndBreak(req, res) {
  try {
    const photoUrl = req.imageUrl || "null";
    const validation = EndBreakSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        status: false,
        message: validation.error.issues[0].message,
      });
    }
    const { breakMethod, biometricData, qrCodeValue, location } =
      validation.data;

    // Fetch the user details, including their staff ID
    const user = await prisma.user.findFirst({
      where: { id: req.userId, role: "STAFF" },
      include: { staffDetails: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate input using Zod schema
    const end = EndBreakSchema.parse({
      staffId: user.staffDetails.id,
      breakMethod,
      biometricData,
      qrCodeValue,
      photoUrl,
      location,
    });

    const staffId = end.staffId;
    // Get the current time in IST
    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentISTTime = new Date(indiaTime); // Parse it into a Date object

    // Find the latest startBreak for this staffId
    const existingStartBreak = await prisma.startBreak.findFirst({
      where: {
        staffId: end.staffId,
        startBreakTime: {
          lte: currentISTTime, // Ensure the startBreakTime is earlier or equal to the current time
        },
      },
      orderBy: { startBreakTime: "desc" }, // Order by the most recent startBreak
    });

    // If no startBreak is found or the latest startBreak doesn't exist, return an error
    if (!existingStartBreak) {
      return res.status(400).json({
        error:
          "Cannot create endBreak without a valid startBreak. Please start a break first.",
      });
    }

    // Check if an endBreak already exists for this staffId and if the latest startBreak is already ended
    const existingEndBreak = await prisma.endBreak.findFirst({
      where: {
        staffId: end.staffId,
        endBreakTime: {
          gte: existingStartBreak.startBreakTime, // Ensure endBreak is after the corresponding startBreak
        },
      },
      orderBy: { endBreakTime: "desc" }, // Order by the most recent endBreak
    });

    // If an endBreak is found for the latest startBreak, return an error
    if (existingEndBreak) {
      return res.status(400).json({
        error:
          "The latest startBreak has already been ended. Please start a new break before ending it.",
      });
    }

    // Prepare break data based on the break method
    let breakData = { breakMethod, location };
    if (breakMethod === "PHOTOCLICK") {
      breakData = { ...breakData, photoUrl };
    } else if (breakMethod === "QRSCAN") {
      breakData = { ...breakData, qrCodeValue };
    } else if (breakMethod === "BIOMETRIC") {
      breakData = { ...breakData, biometricData };
    }

    // Use a transaction to ensure the integrity of related records
    const result = await prisma.$transaction(async (prisma) => {
      // Create the new endBreak record
      const endBreak = await prisma.endBreak.create({
        data: {
          breakMethod,
          ...breakData,
          location,
          staffId,
          // startBreakId: existingStartBreak.id,
        },
      });

      // Create the breakRecord entry
      const indiaTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      let indianTime = new Date(indiaTime);
      const endBreakRecord = await prisma.breakRecord.create({
        data: {
          staffId: staffId,
          endBreakId: endBreak.id, // Reference the newly created endBreak ID
          breakDate: indianTime, // Use the current date as breakDate
        },
      });

      return { endBreak, endBreakRecord };
    });

    return res.status(201).json(result); // Return the created records
  } catch (error) {
    console.error("Error:", error);

    // Check for Zod validation errors
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }

    // Handle other errors
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAllEndBreaks(req, res) {
  try {
    const breakRecords = await prisma.breakRecord.findMany({
      where: { staffId: req.userId, },
      include: { endBreak: true },
    });
    res.status(200).json(breakRecords?.endBreak);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch endBreaks" });
  }
}

async function getEndBreakByStaffId(req, res) {
  try {
    const { staffId } = req.params;
    const endBreaks = await prisma.endBreak.findMany({
      where: { staffId },
    });
    res.status(200).json(endBreaks);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch endBreaks" });
  }
}

module.exports = {
  createStartBreak,
  createEndBreak,
  getAllStartBreaks,
  getStartBreakByStaffId,
  getAllEndBreaks,
  getEndBreakByStaffId,
  getBreakRecordByStaffId,
  getBreakRecordByDate,
};
