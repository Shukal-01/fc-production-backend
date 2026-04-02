const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ShiftSchema = require("../../utils/validations").ShiftSchema;
const { ZodError } = require("zod");
const {
  FixedShiftSchema,
  FlexibleShiftSchema,
  weekOffShiftSchema,
  MultipleFlexibleShiftSchema,
  MultipleFixedShiftSchema,
} = require("../../utils/validations");

async function getShiftById(req, res) {
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
    return res
      .status(400)
      .json({ message: "Only admin can fetch shift by id!" });
  }
  try {
    const shift = await prisma.shifts.findUnique({
      where: { id },
      include: {
        FixedShifts: true,
        FlexibleShift: true,
        Fine: true,
      },
    });
    if (!shift) {
      return res.status(200).json({ error: "Shift not found" });
    }
    res.status(200).json(shift);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch shift" });
  }
}

async function createShift(req, res) {
  try {
    const {
      shiftName,
      shiftStartTime,
      shiftEndTime,
      punchInType,
      punchOutType,
      allowPunchInHours,
      allowPunchInMinutes,
      allowPunchOutHours,
      allowPunchOutMinutes,
    } = req.body;

    const shiftResult = ShiftSchema.safeParse({
      shiftName,
      shiftStartTime,
      shiftEndTime,
      punchInType,
      punchOutType,
      allowPunchInHours,
      allowPunchInMinutes,
      allowPunchOutHours,
      allowPunchOutMinutes,
    });
    if (!shiftResult.success) {
      return res.status(400).json({
        status: false,
        message: shiftResult.error.issues[0].message,
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
      return res.status(400).json({ message: "Only admin can create shift!" });
    }
    const newShiftPolicy = await prisma.shifts.create({
      data: {
        ...shiftResult.data,
        adminId: req.userId,
      },
    });
    res.status(201).json(newShiftPolicy);
  } catch (error) {
    // console.log(error);
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      console.log(error);
      res.status(500).json({ error: "Failed to create new shift" });
    }
  }
}

async function deleteShift(req, res) {
  const { id } = req.params;
  try {
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found!" });
    }
    if (admin.role !== "ADMIN") {
      return res.status(400).json({ message: "Only admin can delete shift!" });
    }
    const deletedShift = await prisma.shifts.delete({
      where: { id, adminId: req.userId },
    });
    res.status(200).json(deletedShift);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to delete shift" });
  }
}

async function deleteMultipleShifts(req, res) {
  const { ids } = req.body;
  try {
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found!" });
    }
    if (admin.role !== "ADMIN") {
      return res
        .status(400)
        .json({ message: "Only admin can delete multiple shifts!" });
    }

    // Fetch shifts before deleting
    const shiftsToDelete = await prisma.shifts.findMany({
      where: { id: { in: ids }, adminId: req.userId },
    });

    if (shiftsToDelete.length === 0) {
      return res.status(404).json({ message: "No shifts found to delete" });
    }

    // Delete shifts
    const shiftDelete = await prisma.shifts.deleteMany({
      where: { id: { in: ids }, adminId: req.userId },
    });

    // Return deleted shifts data
    res.status(200).json({ message: "Shifts deleted successfully", deletedShifts: shiftsToDelete, shiftDelete });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      res.status(500).json({ error: "Failed to delete shifts" });
    }
  }
}

async function updateShift(req, res) {
  const { id } = req.params;
  const {
    shiftName,
    shiftStartTime,
    shiftEndTime,
    punchInType,
    punchOutType,
    allowPunchInHours,
    allowPunchInMinutes,
    allowPunchOutHours,
    allowPunchOutMinutes,
  } = req.body;
  try {
    const shiftResult = ShiftSchema.safeParse({
      shiftName,
      shiftStartTime,
      shiftEndTime,
      punchInType,
      punchOutType,
      allowPunchInHours,
      allowPunchInMinutes,
      allowPunchOutHours,
      allowPunchOutMinutes,
    });
    if (!shiftResult.success) {
      return res.status(400).json({
        status: false,
        message: shiftResult.error.issues[0].message,
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
      return res.status(400).json({ message: "Only admin can create shift!" });
    }
    const shift = await prisma.shifts.update({
      where: { id },
      data: {
        shiftName,
        shiftStartTime,
        shiftEndTime,
        punchInType,
        punchOutType,
        allowPunchInHours,
        allowPunchInMinutes,
        allowPunchOutHours,
        allowPunchOutMinutes,
      },
    });
    res.status(200).json(shift);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to update shift" });
  }
}

async function updateMultipleShifts(req, res) {
  const { shifts } = req.body; // Expect an array of shifts

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
    return res
      .status(400)
      .json({ message: "Only admin can update multiple shift!" });
  }

  try {
    const updatedShifts = await prisma.$transaction(
      shifts.map((shift) =>
        prisma.shifts.update({
          where: { id: shift.id },
          data: {
            shiftName: shift.shiftName,
            shiftStartTime: shift.shiftStartTime,
            shiftEndTime: shift.shiftEndTime,
            allowPunchInHours: shift.allowPunchInHours,
            allowPunchInMinutes: shift.allowPunchInMinutes,
            punchInType: shift.punchInType,
            punchOutType: shift.punchOutType,
          },
        })
      )
    );
    res.status(200).json(updatedShifts);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to update shifts" });
  }
}

async function getAllShift(req, res) {
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
      return res
        .status(400)
        .json({ message: "Only admin can fetch all shift!" });
    }
    const shifts = await prisma.shifts.findMany({
      where: { adminId: req.userId },
      include: {
        FixedShifts: true,
        FlexibleShift: true,
        Fine: true,
      },
    });
    res.status(200).json(shifts);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
}

async function getFixedShifts(req, res) {
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
      return res
        .status(400)
        .json({ message: "Only admin can fetch fixed shifts!" });
    }
    const fixedShifts = await prisma.fixedShift.findMany({
      include: {
        week: true, // Include related WeekOff entry
        shifts: true, // Include related Shifts entries
        staff: true, // Include related StaffDetails entry
      },
    });
    res.status(200).json(fixedShifts);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch fixed shifts" });
  }
}

async function createFixedShift(req, res) {
  try {
    const { day, weekOff, staffId, shifts } = req.body;

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
      return res
        .status(400)
        .json({ message: "Only admin can create fixed shift!" });
    }

    // Check if the staff member exists
    const staffExists = await prisma.staffDetails.findUnique({
      where: { id: staffId },
    });
    if (!staffExists) {
      return res.status(404).json({ error: "Staff not found" });
    }
    // Parse and validate input
    const fixedShiftResult = FixedShiftSchema.parse({
      day,
      weekOff,
      staffId,
      shifts: shifts || [], // Default to an empty array if shiftId is undefined
    });

    // if (!fixedShiftResult.success) {
    //   return res.status(400).json({
    //     status: false,
    // message: fixedShiftResult.error.issues[0].message,
    //   });
    // }

    // Initialize the weekId as null, we will populate this if weekOff is true
    let weekId = null;

    // Create a WeekOff entry if weekOff is true
    if (weekOff) {
      // Validate the weekOffShift data
      const weekOffShiftData = weekOffShiftSchema.parse({
        weekOne: req.body.weekOne,
        weekTwo: req.body.weekTwo,
        weekThree: req.body.weekThree,
        weekFour: req.body.weekFour,
        weekFive: req.body.weekFive,
      });

      const weekOffEntry = await prisma.weekOffShift.create({
        data: weekOffShiftData,
      });
      weekId = weekOffEntry.id;
      // console.log(weekOffEntry)
    }

    // Delete all FlexibleShift entries for the specified staffId
    await prisma.flexibleShift.deleteMany({
      where: { staffId },
    });

    // Create the FixedShift entry, including the newly created weekId if applicable
    const fixedShift = await prisma.fixedShift.create({
      data: {
        day: fixedShiftResult.day,
        weekOff: fixedShiftResult.weekOff,
        staffId: fixedShiftResult.staffId,
        shifts: { connect: fixedShiftResult.shifts.map((id) => ({ id })) }, // Link shift IDs if provided
        // shifts: fixedShiftResult.shifts,
        weekId, // Link the WeekOff ID if created
      },
      include: {
        week: true, // Include related WeekOff entry
        shifts: true, // Include related shifts
        staff: true, // Include related staff details
      },
    });
    // console.log(fixedShift)
    res.status(201).json(fixedShift);
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Invalid request data", details: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ error: "Failed to create new fixedShift" });
    }
  }
}

async function createOrUpdateFixedShift(req, res) {
  try {
    const { staffId, shifts } = req.body;
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
      return res
        .status(400)
        .json({ message: "Only admin can create or update fixed shift!" });
    }

    if (!shifts || !Array.isArray(shifts)) {
      return res.status(400).json({ error: "Invalid shifts data" });
    }

    const staffExists = await prisma.staffDetails.findUnique({
      where: { id: staffId },
    });
    if (!staffExists) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Fetch all shift IDs from the database
    const allShiftIds = await prisma.shifts.findMany({
      where: { id: { in: shifts.flatMap((shifts) => shifts.shifts) } },
      select: { id: true },
    });
    const existingShiftIds = new Set(allShiftIds.map((shifts) => shifts.id));

    // Filter out any shifts with non-existent IDs
    const validatedShifts = shifts.filter((shifts) =>
      shifts.shifts.every((shiftId) => existingShiftIds.has(shiftId))
    );

    if (validatedShifts.length !== shifts.length) {
      return res
        .status(400)
        .json({ error: "One or more shift IDs do not exist" });
    }

    await prisma.flexibleShift.deleteMany({
      where: { staffId },
    });

    const days = shifts.map((shift) => shift.day);
    const existingShifts = await prisma.fixedShift.findMany({
      where: { staffId, day: { in: days } },
      select: { id: true, day: true },
    });

    const existingShiftsMap = new Map(
      existingShifts.map((shift) => [shift.day, shift])
    );
    const updates = [];
    const creations = [];

    for (const shift of validatedShifts) {
      const { day, weekOff, shifts } = shift;
      let weekId = null;

      if (weekOff) {
        const weekOffShiftData = {
          weekOne: shift.weekOne,
          weekTwo: shift.weekTwo,
          weekThree: shift.weekThree,
          weekFour: shift.weekFour,
          weekFive: shift.weekFive,
        };

        const newWeekOff = await prisma.weekOffShift.create({
          data: weekOffShiftData,
        });
        weekId = newWeekOff.id;
      }

      const shiftData = {
        staffId,
        day,
        weekOff,
        weekId,
        shifts: {
          connect: (shifts || []).map((id) => ({ id })),
        },
      };

      if (existingShiftsMap.has(day)) {
        updates.push(
          prisma.fixedShift.update({
            where: { id: existingShiftsMap.get(day).id },
            data: shiftData,
          })
        );
      } else {
        creations.push({
          data: { ...shiftData },
        });
      }
    }

    await prisma.$transaction([
      ...updates,
      ...creations.map((creation) => prisma.fixedShift.create(creation)),
    ]);

    // Fetch the updated/created records with the related data
    const results = await prisma.fixedShift.findMany({
      where: { staffId },
      include: {
        shifts: true,
        staff: true,
        week: true,
      },
    });

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create or update fixed shifts" });
  }
}

async function updateFixedShifts(req, res) {
  try {
    let { staffId, shifts } = req.body;

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
      return res
        .status(400)
        .json({ message: "Only admin can update fixed shifts!" });
    }

    if (!shifts || shifts.length === 0) {
      return res.status(400).json({ error: "Shifts data is required." });
    }

    if (staffId.length === 0) {
      const staffIds = await prisma.staffDetails.findMany({
        select: { id: true },
      });
      staffId = staffIds.map((staff) => staff.id);
    }

    await Promise.all(
      staffId.map(async (id) => {
        const staffExists = await prisma.staffDetails.findUnique({
          where: { id },
        });
        if (!staffExists) {
          throw new Error(`Staff member with ID ${id} does not exist.`);
        }
      })
    );

    await prisma.flexibleShift.deleteMany({
      where: {
        staffId: {
          in: staffId, // This checks if the staffId is in the array
        },
      },
    });

    // Process each staff member’s shifts (for all days from Mon to Sun)
    const updatedFixedShifts = await Promise.all(
      staffId.map(async (id) => {
        return Promise.all(
          shifts.map(async (shiftData) => {
            const { day, weekOff, shifts: shiftIds } = shiftData;

            // Ensure weekOff-specific fields only if weekOff is true
            let weekId = null;
            if (weekOff) {
              const weekOffShiftData = {
                weekOne: shiftData.weekOne || false,
                weekTwo: shiftData.weekTwo || false,
                weekThree: shiftData.weekThree || false,
                weekFour: shiftData.weekFour || false,
                weekFive: shiftData.weekFive || false,
              };
              const newWeekOff = await prisma.weekOffShift.create({
                data: weekOffShiftData,
              });
              weekId = newWeekOff.id;
            }

            // Check if a FixedShift entry already exists for the specific day
            const existingFixedShift = await prisma.fixedShift.findFirst({
              where: { staffId: id, day },
            });

            if (existingFixedShift) {
              // Update the existing entry if found
              return await prisma.fixedShift.update({
                where: { id: existingFixedShift.id },
                data: {
                  day,
                  weekOff,
                  shifts: {
                    set: (shiftIds || []).map((shiftId) => ({ id: shiftId })),
                  },
                  weekId,
                },
                include: {
                  week: true,
                  shifts: true,
                  staff: true,
                },
              });
            } else {
              // Create a new entry if not found
              return await prisma.fixedShift.create({
                data: {
                  day,
                  weekOff,
                  staffId: id,
                  shifts: {
                    connect: (shiftIds || []).map((shiftId) => ({
                      id: shiftId,
                    })),
                  },
                  weekId,
                },
                include: {
                  week: true,
                  shifts: true,
                  staff: true,
                },
              });
            }
          })
        );
      })
    );

    res.status(200).json({
      data: updatedFixedShifts.flat(),
      message: "Fixed shifts updated successfully.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ error: "Invalid request data", details: error.message });
    } else if (error.message.includes("does not exist")) {
      res.status(400).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({
        error: "Failed to update fixed shifts",
        details: error.message,
      });
    }
  }
}

async function getFlexibleShifts(req, res) {
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
      return res
        .status(400)
        .json({ message: "Only admin can fetch flexible shifts!" });
    }
    const flexibleShifts = await prisma.flexibleShift.findMany({
      include: {
        staff: true,
        shifts: true,
      },
    });
    res.status(200).json(flexibleShifts);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch fixed shifts" });
  }
}

async function createFlexibleShift(req, res) {
  try {
    const { dateTime, weekOff, staffId, shifts } = req.body;

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
      return res
        .status(400)
        .json({ message: "Only admin can create flexible shift!" });
    }
    // console.log(req.body)
    // Check if the staff member exists
    const staffExists = await prisma.staffDetails.findUnique({
      where: { id: staffId },
    });

    if (!staffExists) {
      return res.status(404).json({ error: "Staff not found" });
    }
    const fexibleShiftResult = FlexibleShiftSchema.parse({
      weekOff,
      staffId,
      shifts: shifts || [],
      dateTime,
    });

    if (!fexibleShiftResult.success) {
      return res.status(400).json({
        status: false,
        message: fexibleShiftResult.error.issues[0].message,
      });
    }

    // Delete all FixedShift entries for the specified staffId
    await prisma.fixedShift.deleteMany({
      where: { staffId },
    });

    // Create the FlexibleShift entry
    const flexibleShift = await prisma.flexibleShift.create({
      data: {
        dateTime: fexibleShiftResult.dateTime,
        weekOff: fexibleShiftResult.weekOff,
        staffId: fexibleShiftResult.staffId,
        shifts: { connect: fexibleShiftResult.shifts.map((id) => ({ id })) },
      },
      include: {
        shifts: true, // Include related shifts
        staff: true, // Include related staff details
      },
    });

    res.status(201).json(flexibleShift);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      // console.log(error);
      res.status(500).json({ error: "Failed to create new flexibleShift" });
    }
  }
}

async function updateFlexibleShift(req, res) {
  try {
    let { staffId, shifts } = req.body;
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
      return res
        .status(400)
        .json({ message: "Only admin can update flexibe shift!" });
    }

    // console.log(staffId, shifts);

    if (staffId.length === 0) {
      const staffIds = await prisma.staffDetails.findMany({
        select: { id: true },
      });
      staffId = staffIds.map((staff) => staff.id);
    }

    // Process updates for each staff member
    const updatedFlexibleShifts = [];

    // Loop through each staffId in the array
    for (const id of staffId) {
      // Check if the staff member exists
      const staffExists = await prisma.staffDetails.findUnique({
        where: { id },
      });
      if (!staffExists) {
        throw new Error(`Staff with ID ${id} not found`);
      }
      const existingFixedShifts = await prisma.fixedShift.findMany({
        where: { staffId: id },
      });

      if (existingFixedShifts.length > 0) {
        await prisma.fixedShift.deleteMany({
          where: { staffId: id },
        });
      }

      // Process each shift for the staff member
      for (const shiftData of shifts) {
        const { dateTime, weekOff, shifts } = shiftData;

        // Ensure that all shift IDs are valid before trying to connect them
        const shiftRecords = await prisma.shifts.findMany({
          where: {
            id: {
              in: shifts, // Use the shift IDs you are trying to connect
            },
          },
        });

        // If the number of records returned doesn't match the number of shift IDs, throw an error
        if (shiftRecords.length !== shifts.length) {
          throw new Error(
            "Some shift IDs are invalid or not found in the database"
          );
        }

        // Upsert FlexibleShift entry
        const upsertedShift = await prisma.flexibleShift.upsert({
          where: {
            staffId_dateTime: { staffId: id, dateTime },
          },
          update: {
            weekOff,
            shifts: {
              set: (shiftRecords || []).map((shift) => ({ id: shift.id })),
            },
          },
          create: {
            dateTime,
            weekOff,
            staffId: id, // Set staffId for each individual staff member
            shifts: {
              connect: (shiftRecords || []).map((shift) => ({ id: shift.id })),
            },
          },
          include: {
            shifts: true,
            staff: true,
          },
        });

        // Refetch with populated shifts
        updatedFlexibleShifts.push(upsertedShift);
      }
    }

    res.status(200).json({
      data: updatedFlexibleShifts,
      message: "Flexible shifts updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update flexible shifts",
    });
  }
}

async function updateOrCreateFlexibleShift(req, res) {
  try {
    const { staffId, shifts } = req.body;

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
      return res
        .status(400)
        .json({ message: "Only admin can update flexible shift!" });
    }

    // Check if the staff member exists
    const staffExists = await prisma.staffDetails.findUnique({
      where: { id: staffId },
    });

    if (!staffExists) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Delete all flexible shifts for the given staff member before proceeding
    await prisma.fixedShift.deleteMany({
      where: { staffId: staffId }, // Delete all flexible shifts for this staff member
    });

    const results = [];
    for (const shift of shifts) {
      const { dateTime, weekOff, shifts } = shift;

      const shiftData = {
        dateTime,
        weekOff,
      };

      const upsertedShift = await prisma.flexibleShift.upsert({
        where: {
          staffId_dateTime: { staffId, dateTime },
        },
        update: {
          ...shiftData,
          shifts: {
            set: (shifts || []).map((id) => ({ id })),
          },
        },
        create: {
          ...shiftData,
          staffId,
          shifts: {
            connect: (shifts || []).map((id) => ({ id })),
          },
        },
        include: {
          shifts: true,
          staff: true,
        },
      });

      // Refetch with populated shifts
      const fullShiftData = await prisma.flexibleShift.findUnique({
        where: { id: upsertedShift.id },
        include: {
          shifts: true,
          staff: true,
        },
      });

      results.push(fullShiftData);
    }

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to update or create flexible shifts" });
  }
}

module.exports = {
  getShiftById,
  createShift,
  deleteShift,
  deleteMultipleShifts,
  updateShift,
  getAllShift,
  getFixedShifts,
  createOrUpdateFixedShift,
  createFixedShift,
  updateFixedShifts,
  getFlexibleShifts,
  createFlexibleShift,
  updateFlexibleShift,
  updateMultipleShifts,
  updateOrCreateFlexibleShift,
};
