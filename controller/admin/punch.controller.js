const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ZodError } = require("zod");
const {
  PunchInSchema,
  PunchOutSchema,
  PunchRecordsSchema,
  salaryDetailsSchema,
} = require("../../utils/validations");
const { parseTime } = require("../../utils/helper");

async function createPunchIn(req, res) {
  try {
    const { punchInMethod, biometricData, qrCodeValue, location } = req.body;

    const validation = PunchInSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        status: false,
        message: validation.error.issues[0].message,
      });
    }
    const photoUrl = req.imageUrl ?? "null";

    const currentDate = new Date();
    // Start of the month (e.g., "2025-01-01T00:00:00.000Z")
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();

    // End of the month (e.g., "2025-01-31T23:59:59.999Z")
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).toISOString();

    const user = await prisma.user.findFirst({
      where: { id: req.userId, role: "STAFF" },
      include: {
        staffDetails: {
          include: {
            FixedShift: { include: { shifts: true } },
            FlexibleShift: { include: { shifts: true } },
            SalaryDetails: {
              where: {
                effective_date: {
                  gt: startOfMonth, // Start of the month in ISO format
                  lte: endOfMonth, // End of the month in ISO format
                },
              },
            },
            EarlyLeavePolicy: true,
            LateComingPolicy: true,
            OverLeavePolicy: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);

    const existingPunchRecord = await prisma.punchRecords.findFirst({
      where: {
        staffId: user.staffDetails.id,
        punchDate: {
          gte: today,
          lt: tom,
        },
      },
    });

    if (existingPunchRecord && existingPunchRecord.punchInId) {
      return res.status(400).send("Punch in already created");
    }

    if (
      !user.staffDetails.FlexibleShift.length &&
      !user.staffDetails.FixedShift.length
    ) {
      // console.log("No shift found");
      return res.status(404).send("No shift found");
    }

    const currentDay = today
      .toLocaleString("en-US", { weekday: "short" })
      .toUpperCase();

    const shiftType = user.staffDetails.FixedShift.length
      ? "FIXED"
      : "FLEXIBLE";

    let shift;
    let start;
    let end;

    if (shiftType === "FIXED") {
      shift = user.staffDetails.FixedShift.find(
        (sh) => sh.day.toUpperCase() === currentDay
      );

      if (!shift || shift.shifts.length == 0) {
        return res.status(404).send("No shift found");
      }

      start = parseTime(shift.shifts[0].shiftStartTime);
      end = parseTime(shift.shifts[0].shiftEndTime);
      // console.log(start, end);
    }

    if (shiftType === "FLEXIBLE") {
      shift = await prisma.flexibleShift.findFirst({
        where: {
          staffId: user.staffDetails.id,
          dateTime: { gt: today, lte: tom },
        },
        include: { shifts: true },
      });

      if (shift === null || shift.weekOff === true) {
        return res.status(400).json({ error: "Today is a week off." });
      }
      start = parseTime(shift.shifts[0].shiftStartTime);
      end = parseTime(shift.shifts[0].shiftEndTime);

      shift = shift.shifts[0];
    }

    PunchInSchema.parse({
      punchInMethod,
      biometricData,
      qrCodeValue,
      photoUrl,
      location,
    });

    let punchInData = { punchInMethod, location };

    if (punchInMethod === "PHOTOCLICK") {
      punchInData.photoUrl = photoUrl;
    } else if (punchInMethod === "QRSCAN") {
      punchInData.qrCodeValue = qrCodeValue;
    } else if (punchInMethod === "BIOMETRIC") {
      punchInData.biometricData = biometricData;
    }

    const salary = user.staffDetails.SalaryDetails[0]?.ctc_amount;

    if (!salary) {
      return res.status(404).send("No salary details found");
    }

    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const currTime = new Date(indiaTime);
    const shiftStartTime = new Date(indiaTime);
    shiftStartTime.setHours(start.hours, start.minutes, 0);

    let shiftEndTime = new Date(currTime);
    shiftEndTime.setHours(end.hours, end.minutes, 0);

    // Calculate late entry fine (existing code)
    if (currTime >= shiftStartTime) {
      const punchIn = await prisma.punchIn.create({
        data: {
          punchInMethod,
          ...punchInData,
          location,
        },
      });

      const punchRecord = await prisma.punchRecords.upsert({
        where: {
          staffId_punchDate: {
            staffId: user.staffDetails.id,
            punchDate: today,
          },
        },
        create: {
          punchIn: { connect: { id: punchIn.id } },
          staff: { connect: { id: user.staffDetails.id } },
          status: "PRESENT",
        },
        update: {
          punchIn: { connect: { id: punchIn.id } },
          staff: { connect: { id: user.staffDetails.id } },
          status: "PRESENT",
        },
      });
      const lateComingPolicy = user?.staffDetails?.LateComingPolicy || {};
      const gracePeriodMins = lateComingPolicy.gracePeriodMins ?? 0; // Default to 0 if not defined

      // Calculate grace-based late minutes
      const calculateGrace = Math.max(
        0,
        Math.floor((currTime - shiftStartTime) / (1000 * 60)) - gracePeriodMins
      );

      let lateMinutes;
      if (gracePeriodMins === 0) {
        // No grace period, calculate late minutes directly from shift start time
        lateMinutes = Math.max(
          0,
          Math.floor((currTime - shiftStartTime) / (1000 * 60))
        );
      } else {
        // Grace period exists, calculate late minutes based on the grace period
        lateMinutes = calculateGrace;
      }

      if (lateMinutes > 0 && user.staffDetails.applyFine) {
        const totalWorkingMinutes = Math.floor(
          (shiftEndTime - shiftStartTime) / (1000 * 60)
        );

        const dailySalary = salary / 30;
        const salaryPerMinute = dailySalary / totalWorkingMinutes;
        const fine = lateMinutes * salaryPerMinute;
        await prisma.fine.create({
          data: {
            lateEntryAmount: parseFloat(fine.toFixed(2)),
            lateEntryFineHoursTime: convertMinutesToHHMM(lateMinutes),
            lateEntryAmount: fine,
            punchRecord: { connect: { id: punchRecord.id } },
            staff: { connect: { id: user.staffDetails.id } },
            shiftDetails: { connect: { id: shift.shifts[0].id } },
          },
        });
      }
      return res.status(201).json({
        punchIn,
        punchRecord,
      });
    } else {
      const overtimePolicy = user.staffDetails.OverLeavePolicy;
      const overtimeGracePeriod = overtimePolicy.gracePeriodMins ?? 0; // For example, 10 mins

      let overtimeMinutes;
      if (overtimeGracePeriod === 0) {
        // No grace period, calculate overtime directly before the shift start time
        overtimeMinutes = Math.max(
          0,
          Math.floor((shiftStartTime - currTime) / (1000 * 60))
        );
      } else {
        // Grace period exists, calculate overtime excluding grace period
        const timeBeforeStartTime = Math.floor((shiftStartTime - currTime) / (1000 * 60));
        overtimeMinutes = Math.max(0, timeBeforeStartTime - overtimeGracePeriod);
      }

      // Calculate overtime only if there are overtime minutes and the policy allows it
      if (overtimeMinutes > 0 && user.staffDetails.applyOvertime) {
        const totalWorkingMinutes = Math.floor(
          (shiftEndTime - shiftStartTime) / (1000 * 60)
        );
        const dailySalary = salary / 30; // Assuming 30 days in a month
        const salaryPerMinute = dailySalary / totalWorkingMinutes;
        const overtimeAmount = overtimeMinutes * salaryPerMinute;
        await prisma.overtime.create({
          data: {
            overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
            overtimeHoursTime: convertMinutesToHHMM(overtimeMinutes),
            punchRecord: { connect: { id: punchRecord.id } },
            staff: { connect: { id: user.staffDetails.id } },
            shiftDetails: { connect: { id: shift.shifts[0].id } },
          },
        });
      }

      return res.status(201).json({
        punchIn,
        punchRecord,
      });
    }
  } catch (error) {
    // console.log(error);
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }

    return res.status(500).json({ error: "Failed to create punch-in" });
  }
}

async function getAllPunchIn(req, res) {
  try {
    const records = await prisma.punchIn.findMany({
      include: {
        PunchRecords: true,
      },
    });
    return res.status(200).json(records);
  } catch (error) {
    // console.log(error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve punch-in records" });
  }
}

async function createPunchOut(req, res) {
  try {
    const { punchOutMethod, biometricData, qrCodeValue, location } = req.body;

    const validation = PunchInSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        status: false,
        message: validation.error.issues[0].message,
      });
    }

    const photoUrl = req.imageUrl ?? "null";

    const user = await prisma.user.findFirst({
      where: { id: req.userId, role: "STAFF" },
      include: {
        staffDetails: {
          include: {
            FixedShift: { include: { shifts: true } },
            FlexibleShift: { include: { shifts: true } },
            SalaryDetails: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);

    const existingPunchRecord = await prisma.punchRecords.findFirst({
      where: {
        staffId: user.staffDetails.id,
        punchDate: {
          gte: today,
          lt: tom,
        },
      },
    });

    if (!existingPunchRecord || !existingPunchRecord.punchInId) {
      return res.status(400).send("No punch-in found for today");
    }

    if (existingPunchRecord.punchOutId) {
      return res.status(400).send("Punch-out already exists");
    }

    if (
      !user.staffDetails.FlexibleShift.length &&
      !user.staffDetails.FixedShift.length
    ) {
      return res.status(404).send("No shift found");
    }

    const currentDay = today
      .toLocaleString("en-US", { weekday: "short" })
      .toUpperCase();

    const shiftType = user.staffDetails.FixedShift.length
      ? "FIXED"
      : "FLEXIBLE";

    let shift;
    let start;
    let end;

    if (shiftType === "FIXED") {
      shift = user.staffDetails.FixedShift.find(
        (sh) => sh.day.toUpperCase() === currentDay
      );

      if (!shift || shift.shifts.length === 0) {
        return res.status(404).send("No shift found");
      }

      start = parseTime(shift.shifts[0].shiftStartTime);
      end = parseTime(shift.shifts[shift.shifts.length - 1].shiftEndTime);
    }

    if (shiftType === "FLEXIBLE") {
      shift = await prisma.flexibleShift.findFirst({
        where: {
          staffId: user.staffDetails.id,
          dateTime: { gt: today, lte: tom },
        },
        include: { shifts: true },
      });

      if (shift === null || shift.weekOff === true) {
        return res.status(400).json({ error: "Today is a week off." });
      }
      start = parseTime(shift.shifts[0].shiftStartTime);
      end = parseTime(shift.shifts[shift.shifts.length - 1].shiftEndTime);
    }

    PunchOutSchema.parse({
      punchOutMethod,
      biometricData,
      qrCodeValue,
      photoUrl,
      location,
    });

    let punchOutData = { punchOutMethod, location };

    if (punchOutMethod === "PHOTOCLICK") {
      punchOutData.photoUrl = photoUrl;
    } else if (punchOutMethod === "QRSCAN") {
      punchOutData.qrCodeValue = qrCodeValue;
    } else if (punchOutMethod === "BIOMETRIC") {
      punchOutData.biometricData = biometricData;
    }

    const salary =
      user.staffDetails.SalaryDetails[
        user.staffDetails.SalaryDetails.length - 1
      ]?.ctc_amount ?? 10000;

    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const currTime = new Date(indiaTime);
    let shiftStartTime = new Date(currTime);
    shiftStartTime.setHours(start.hours, start.minutes, 0);
    let shiftEndTime = new Date(currTime);
    shiftEndTime.setHours(end.hours, end.minutes, 0);

    const overtimePolicy = user?.staffDetails?.OverLeavePolicy || {};
    const overtimeGrace = overtimePolicy.gracePeriodMins ?? 0;
    const maxWorkingHours = overtimePolicy.maxWorkingHours ?? 12;

    // Calculate overtime if punch-out is after shift end time (late out)
    if (currTime > shiftEndTime) {
      const lateMinutes = Math.max(
        0,
        Math.floor((currTime - shiftEndTime) / (1000 * 60))
      );

      const totalWorkingMinutes = Math.floor(
        (shiftEndTime - shiftStartTime) / (1000 * 60)
      );

      const daysInMonth = new Date(
        currTime.getFullYear(),
        currTime.getMonth() + 1,
        0
      ).getDate();

      const dailySalary = salary / daysInMonth;
      const salaryPerMinute = dailySalary / totalWorkingMinutes;

      // Apply overtime grace period
      const adjustedLateMinutes =
        overtimeGrace > 0 ? Math.max(0, lateMinutes - overtimeGrace) : lateMinutes;

      // Ensure total working hours don't exceed maximum
      const totalMinutesWorked =
        totalWorkingMinutes + adjustedLateMinutes;

      if (totalMinutesWorked > maxWorkingHours * 60) {
        adjustedLateMinutes -= totalMinutesWorked - maxWorkingHours * 60;
      }

      const overtimePay = adjustedLateMinutes * salaryPerMinute;

      if (overtimePay > 0) {
        await prisma.overtime.create({
          data: {
            overtimeAmount: overtimePay,
            overtimeMinutes: adjustedLateMinutes,
            punchRecord: { connect: { id: existingPunchRecord.id } },
            staff: { connect: { id: user.id } },
          },
        });
      }
    }

    const punchOut = await prisma.punchOut.create({
      data: {
        punchOutMethod,
        ...punchOutData,
        location,
      },
    });

    const punchRecord = await prisma.punchRecords.update({
      where: { id: existingPunchRecord.id },
      data: {
        punchOut: { connect: { id: punchOut.id } },
        status: "PRESENT",
      },
    });

    return res.status(201).json({ punchOut, punchRecord });
  } catch (error) {
    // console.log(error);
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }

    return res
      .status(500)
      .json({ error: "Failed to create punch-out: " + error.message });
  }
}


async function getAllPunchOut(req, res) {
  try {
    const records = await prisma.punchOut.findMany({
      include: {
        punchRecords: true,
      },
    });
    return res.status(200).json(records);
  } catch (error) {
    // console.log(error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve punch-out records" });
  }
}

async function getPunchRecordById(req, res) {
  try {
    const { staffId } = req.params;
    const punchRecords = await prisma.punchRecords.findMany({
      where: {
        staffId,
      },
      include: {
        fine: true,
        Overtime: true,
        punchIn: true,
        punchOut: true,
        staff: true,
      },
    });
    res.status(200).json(punchRecords);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch punch-in" });
  }
}

async function getPunchRecords(req, res) {
  try {
    const { month, year } = req.query; // Month and Year are passed as query params

    // Initialize the date range filter
    let filter = {};

    // If both month and year are provided, apply the date range filter
    if (month && year) {
      const startDate = new Date(year, month - 1, 1); // Start of the month
      const endDate = new Date(year, month, 0); // End of the month

      filter.punchDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Fetch the punch records based on the filter
    const punchRecords = await prisma.punchRecords.findMany({
      where: filter,
      include: {
        punchIn: true,
        punchOut: true,
        staff: true, // Include staff details
        fine: true,
        Overtime: true,
      },
    });

    // If no records are found, return a message
    if (punchRecords.length === 0) {
      return res.status(200).json({
        message:
          month && year
            ? `No punch records found for ${month}-${year}.`
            : "No punch records found.",
      });
    }

    // Calculate the totals for each status
    let totalLeave = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHalfDay = 0;

    // Iterate over punch records to calculate the totals
    punchRecords.forEach((record) => {
      switch (record.status) {
        case "LEAVE":
          totalLeave++;
          break;
        case "PRESENT":
          totalPresent++;
          break;
        case "ABSENT":
          totalAbsent++;
          break;
        case "HALF_DAY":
          totalHalfDay++;
          break;
        default:
          break;
      }
    });

    // Return the calculated results along with the punch records
    return res.status(200).json({
      status: 200,
      message: `Punch records${month && year ? ` for ${month}-${year}` : ""}`,
      data: punchRecords,
      totals: {
        totalLeave,
        totalPresent,
        totalAbsent,
        totalHalfDay,
      },
    });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch punch records" });
  }
}

function convertMinutesToHHMM(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

async function updatePunchRecordApproveStatus(req, res) {
  try {
    const { staffIds } = req.body; // Accepting multiple staff IDs

    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({ error: "Invalid staffIds array." });
    }

    // Fetch punch records for the given staffIds where status is PRESENT
    const punchRecords = await prisma.punchRecords.findMany({
      where: {
        staffId: { in: staffIds },
        // status: "PRESENT", // Only approve if status is PRESENT
      },
    });

    if (punchRecords.length === 0) {
      return res.status(404).json({ message: "No punch records found for approval." });
    }

    // Update all matching records
    await Promise.all(
      punchRecords.map(async (record) => {
        await prisma.punchRecords.update({
          where: { id: record.id },
          data: { isApproved: true },
        });
      })
    );

    return res.status(200).json({ message: "Approval status updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update punch record approval status." });
  }
}

module.exports = {
  createPunchIn,
  getAllPunchIn,
  createPunchOut,
  getAllPunchOut,
  getPunchRecords,
  getPunchRecordById,
  updatePunchRecordApproveStatus,
};
