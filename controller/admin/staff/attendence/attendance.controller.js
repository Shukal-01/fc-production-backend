const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const allStaffAttendanceByDate = async (req, res) => {
  try {
    const { type, date } = req.query;
    const adminId = req.userId;

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    if (type !== "day") {
      return res.status(400).json({ message: "Invalid type. Only 'day' is supported." });
    }

    const [day, month, year] = date.split("/").map(Number);
    const requestedDate = new Date(year, month - 1, day);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (requestedDate > currentDate) {
      return res.status(400).json({
        message: `The requested date (${day}/${month}/${year}) is a future date. No entries are available for future dates.`,
      });
    }

    const staffWithSalary = await prisma.staffDetails.findMany({
      where: {
        User: { adminId },
        SalaryDetails: {
          some: {},
        },
      },
      include: {
        User: true,
        department: true,
        SalaryDetails: true,
      },
    });

    if (staffWithSalary.length === 0) {
      return res.status(200).json({ message: "No staff with salary details found for this month.", records: [] });
    }

    const staffIds = staffWithSalary.map((staff) => staff.id);
    const punchRecords = await prisma.punchRecords.findMany({
      where: {
        staffId: { in: staffIds },
        punchDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        punchIn: true,
        punchOut: true,
        fine: true,
        Overtime: true,
        shift: true,
      },
    });

    const records = staffWithSalary.map((staff) => {
      const staffPunchRecords = punchRecords.filter((record) => record?.staffId === staff?.id);

      return {
        staffId: staff.id,
        staffDetails: {
          User: staff.User,
          department: staff.department,
          SalaryDetails: staff.SalaryDetails,
        },
        punchRecord: staffPunchRecords.length > 0
          ? staffPunchRecords.map(record => ({
            id: record.id,
            staffId: record.staffId,
            isApproved: record.isApproved,
            punchDate: record.punchDate,
            status: record.status,
            shift: record.shift || null,
            fine: record.fine || null,
            Overtime: record.Overtime || null,
            punchIn: record.punchIn
              ? {
                id: record.punchIn.id,
                punchInTime: record.punchIn.punchInTime,
                punchInDate: record.punchIn.punchInDate,
              }
              : null,
            punchOut: record.punchOut
              ? {
                id: record.punchOut.id,
                punchOutTime: record.punchOut.punchOutTime,
                punchOutDate: record.punchOut.punchOutDate,
              }
              : null,
          }))
          : [{
            staffId: staff.id,
            punchDate: startOfDay,
            status: "ABSENT",
            shift: null,
            isApproved: false,
            punchIn: null,
            punchOut: null,
          }],
      };
    });

    return res.status(200).json({
      message: ` Punch records fetched successfully for the requested date (${day}/${month}/${year}).`,
      records,
      admin: req.userId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch staff punch records." });
  }
};

// single staff Attendance get
const getSingleStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, date } = req.query;

    console.log("Requested Staff ID:", id);
    console.log("Requested Date:", date);

    const staff = await prisma.staffDetails.findFirst({
      where: { id: id, User: { adminId: req.userId } },
      select: {
        id: true,
        date_of_joining: true,
      },
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    const [month, year] = date.split("/").map(Number);
    const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const currentDate = new Date(indiaTime);
    currentDate.setHours(0, 0, 0, 0);
    const { date_of_joining } = staff;

    if (type === "day") {
      const [day, month, year] = date.split("/").map(Number);
      const requestedDate = new Date(year, month - 1, day);
      requestedDate.setHours(0, 0, 0, 0);

      if (requestedDate > currentDate) {
        return res.status(400).json({ message: "Future date requested." });
      }

      if (requestedDate < new Date(date_of_joining)) {
        return res.status(400).json({ message: "Date is before staff's joining date." });
      }

      const startOfDay = new Date(requestedDate);
      const endOfDay = new Date(startOfDay.getTime() + 86400000);

      let punchRecord = await prisma.punchRecords.findFirst({
        where: {
          staffId: id,
          punchDate: { gte: startOfDay, lt: endOfDay },
        },
        include: {
          punchIn: true,
          punchOut: true,
          fine: true,
          Overtime: true,
          staff: true,
        },
      });

      if (!punchRecord) {
        punchRecord = await prisma.punchRecords.create({
          data: { staffId: id, punchDate: startOfDay, status: "ABSENT" },
        });
      }

      return res.status(200).json({
        message: "Single-day attendance fetched",
        attendanceRecord: punchRecord,
      });
    }

    if (type === "month") {
      const startMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endMonth = new Date(year, month, 0, 23, 59, 59, 999);
      const joiningDate = new Date(date_of_joining);

      const joiningYear = joiningDate.getFullYear();
      const joiningMonth = joiningDate.getMonth();
      const startYear = startMonth.getFullYear();
      const startMonthIndex = startMonth.getMonth();

      if (startMonth > currentDate) {
        return res.status(400).json({ message: "Future month requested." });
      }

      if (startYear < joiningYear || (startYear === joiningYear && startMonthIndex < joiningMonth)) {
        return res.status(400).json({ message: "Month is before staff's joining date." });
      }


      const records = [];
      for (let day = 1; day <= endMonth.getDate(); day++) {
        const currentDay = new Date(year, month - 1, day);
        const startOfDay = new Date(currentDay.setHours(0, 0, 0, 0));
        const endOfDay = new Date(startOfDay.getTime() + 86400000);

        if (currentDay < new Date(date_of_joining) || currentDay > currentDate) continue;

        let punchRecord = await prisma.punchRecords.findFirst({
          where: {
            staffId: id,
            punchDate: { gte: startOfDay, lt: endOfDay },
          },
          include: {
            punchIn: true,
            punchOut: true,
            fine: true,
            Overtime: true,
            staff: {
              include: {
                FixedShift: {
                  include: {
                    shifts: true
                  }
                },
                FlexibleShift: {
                  include: {
                    shifts: true
                  }
                }
              }
            },
          },
        });

        if (!punchRecord) {
          punchRecord = await prisma.punchRecords.create({
            data: { staffId: id, punchDate: startOfDay, status: "ABSENT" },
          });
        }
        records.push(punchRecord);
      }

      return res.status(200).json({
        message: "Monthly attendance fetched",
        attendanceRecords: records,
      });
    }

    return res.status(400).json({ message: "Invalid type requested." });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


const updatePunchRecordStatus = async (req, res) => {
  const { id } = req.params;
  const { status, shiftId, staffId, startTime, endTime, punchDate } = req.body;

  const validStatuses = ["ABSENT", "PRESENT", "HALFDAY", "PAIDLEAVE"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error:
        "Invalid status. Valid statuses are ABSENT, PRESENT, HALFDAY, PAIDLEAVE.",
    });
  }
  console.log(punchDate)
  try {
    // Find the existing punch record
    let punchRecord = await prisma.punchRecords.findUnique({
      where: { id },
      include: { punchIn: true, punchOut: true },
    });


    // If no punch record exists, create a new one
    if (!punchRecord) {
      punchRecord = await prisma.punchRecords.create({
        data: {
          punchDate: punchDate,
          staff: { connect: { id: staffId } },
          status,
          shift: shiftId ? { connect: { id: shiftId } } : undefined,
        },
        include: { punchIn: true, punchOut: true },
      });
    }

    const updateData = { status, punchDate: punchDate };

    if (shiftId) {
      updateData.shift = { connect: { id: shiftId } };
    }

    if (startTime) {
      updateData.punchIn = punchRecord.punchIn
        ? {
          update: {
            punchInTime: startTime,
            punchInDate: punchDate,
          },
        }
        : {
          create: {
            punchInTime: startTime,
            punchInDate: punchDate,
          },
        };
    }

    if (endTime) {
      updateData.punchOut = punchRecord.punchOut
        ? {
          update: {
            punchOutTime: endTime,
            punchOutDate: punchDate,
          },
        }
        : {
          create: {
            punchOutTime: endTime,
            punchOutDate: punchDate,
          },
        };
    }

    // Update the punch record with relevant data
    const updatedPunchRecord = await prisma.punchRecords.update({
      where: { id: punchRecord.id },
      data: updateData,
      include: { shift: true, punchIn: true, punchOut: true },
    });


    return res.status(200).json({
      message: "Punch record status updated successfully",
      updatedPunchRecord,
    });
  } catch (error) {
    console.error("Error updating punch record:", error);
    return res.status(500).json({ error: "Failed to update punch record status" });
  }
};

// get breakRecord data by staffId and date/month/year
const getBreakRecordByStaffId = async (req, res) => {
  try {
    const { staffId } = req.params; // Get the staffId from URL parameters
    const { date } = req.query; // Get the date (format: 21/11/2024) from query parameters

    // ✅ Date format validation (DD/MM/YYYY)
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (!date) {
      return res
        .status(400)
        .json({ error: "Date is required in format DD/MM/YYYY" });
    }

    if (!dateRegex.test(date)) {
      return res.status(400).json({
        error: "Invalid date format. Please use DD/MM/YYYY (e.g., 02/01/2025)",
      });
    }

    // Parse the input date string
    const [day, month, year] = date.split("/");

    // Start of the day in IST
    // Start of the day in IST
    const startOfDayIST = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const indiaStartTime = new Date(startOfDayIST.getTime() + 5.5 * 60 * 60 * 1000); // Add 5.5 hours for IST offset
    console.log("Start date (IST):", startOfDayIST);

    // End of the day in IST
    const endOfDayIST = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
    const indiaEndTime = new Date(endOfDayIST.getTime() + 5.5 * 60 * 60 * 1000); // Add 5.5 hours for IST offset
    console.log("End date (IST):", endOfDayIST);

    // Fetch all startBreaks for the given staffId and date
    const startBreaks = await prisma.startBreak.findMany({
      where: {
        breakRecord: {
          some: {
            staffId: staffId,
          },
        },
        startBreakTime: {
          gte: startOfDayIST, // Start of the day in IST
          lte: endOfDayIST, // End of the day in IST
        },
      },
      // orderBy: { startBreakTime: "desc" }, // Sort by latest startBreakTime
    });

    if (startBreaks.length === 0) {
      return res.status(404).json({
        message: "No break records found for this staff ID on the given date",
      });
    }

    // Fetch corresponding endBreaks and merge them
    const breakRecords = await Promise.all(
      startBreaks.map(async (startBreak) => {
        // Find the corresponding endBreak for this startBreak
        const endBreak = await prisma.endBreak.findFirst({
          where: {
            breakRecord: {
              some: {
                staffId: staffId,
              },
            },
            endBreakTime: {
              gte: startOfDayIST, // Start of the day in IST
              lte: endOfDayIST, // End of the day in IST
            },
          },
          orderBy: { endBreakTime: "asc" }, // Get the earliest matching endBreak
        });

        // Combine startBreak and endBreak into a single object
        return {
          breakDate: new Date(startBreak.startBreakTime).toLocaleString(
            "en-IN",
            {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ),
          startBreak: {
            ...startBreak,
            startBreakTime: new Date(startBreak.startBreakTime).toLocaleString(
              "en-IN",
              {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }
            ),
          },
          endBreak: endBreak
            ? {
              ...endBreak,
              endBreakTime: new Date(endBreak.endBreakTime).toLocaleString(
                "en-IN",
                {
                  timeZone: "Asia/Kolkata",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              ),
            }
            : null, // If no endBreak, keep it null
        };
      })
    );

    // Return the combined break records as a response
    return res.status(200).json({
      message: `Break Records for ${date}`,
      breakRecords,
    });
  } catch (error) {
    console.error("Error fetching break records:", error);

    // Return an error response for any issues during the process
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMonthlyAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    // const adminId = req.userId;
    // const admin = await prisma.user.findUnique({ where: { id: adminId } });
    // if (!admin || admin.role !== "ADMIN") {
    //   return res.status(403).json({ message: "Unauthorized access." });
    // }

    // Fetch staff details including date of joining
    const staff = await prisma.staffDetails.findFirst({
      where: { id: id, User: { adminId: req.userId } },
      select: {
        id: true,
        date_of_joining: true,
      },
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    const { date_of_joining } = staff;
    const startDate = new Date(date_of_joining);

    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentDate = new Date(indiaTime);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed

    let attendanceData = [];

    // Iterate from the joining month to the current month
    for (let year = startDate.getFullYear(); year <= currentYear; year++) {
      const startMonth =
        year === startDate.getFullYear() ? startDate.getMonth() : 0;
      const endMonth = year === currentYear ? currentMonth : 11;

      for (let month = startMonth; month <= endMonth; month++) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        const monthlyRecords = await prisma.punchRecords.findMany({
          where: {
            staffId: id,
            punchDate: {
              gte: monthStart,
              lt: new Date(monthEnd.getTime() + 86400000),
            },
          },
          include: {
            fine: true,
            Overtime: true,
            punchIn: true,
            punchOut: true,
            staff: {
              include: {
                FixedShift: {
                  include: {
                    shifts: true
                  }
                },
                FlexibleShift: {
                  include: {
                    shifts: true
                  }
                }
              }
            },
          },
        });

        if (monthlyRecords.length === 0) {
          // If no records exist for the month, create ABSENT records for all days
          for (let day = 1; day <= monthEnd.getDate(); day++) {
            const currentDay = new Date(year, month, day);

            if (currentDay < startDate || currentDay > currentDate) continue;

            const newPunchRecord = await prisma.punchRecords.create({
              data: {
                staff: { connect: { id } },
                punchDate: currentDay,
                status: "ABSENT",
              },
            });
            monthlyRecords.push(newPunchRecord);
          }
        }

        attendanceData.push({
          month: ` ${month + 1}-${year}`, // Month is 0-indexed
          records: monthlyRecords,
        });
      }
    }

    return res.status(200).json({
      message: "Monthly attendance records fetched successfully.",
      attendanceData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch monthly attendance records.",
      error: error.message,
    });
  }
};

module.exports = {
  allStaffAttendanceByDate,
  updatePunchRecordStatus,
  getSingleStaffAttendance,
  getBreakRecordByStaffId,
  getMonthlyAttendance,
};