const { PrismaClient } = require("@prisma/client");
const { staffSchema } = require("../../../utils/validations");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid"); // Import UUID library for unique ID generation

const createStaff = async (req, res) => {
  const validation = staffSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data format",
      issues: validation.error.issues[0].message,
    });
  }

  const {
    job_title,
    departmentId,
    branchId,
    roleId,
    mobile,
    login_otp,
    gender,
    official_email,
    date_of_joining,
    date_of_birth,
    current_address,
    permanent_address,
    emergency_contact_name,
    emergency_contact_mobile,
    emergency_contact_relation,
    emergency_contact_address,
    name,
    status,
    employment,
  } = validation.data;

  try {
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: official_email, // Check if email exists
      },
    });

    if (existingEmail) {
      // If email exists, return an error response
      return res.status(400).json({
        message: "Email already exists!",
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
      return res.status(400).json({
        message: "Only admin can create staff!",
      });
    }
    // Generate unique employee ID
    const uniqueEmployeeId = `FLOW#${uuidv4()
      .replace(/-/g, "")
      .substring(0, 5)}`; // example FLOW#54b3u
    const user = await prisma.user.create({
      data: {
        name,
        mobile,
        role: "STAFF",
        email: official_email,
        otp: parseInt(login_otp),
        adminId: req.userId,
        staffDetails: {
          create: {
            job_title,
            departmentId,
            branchId,
            roleId,
            login_otp,
            gender,
            official_email,
            date_of_joining: date_of_joining ? new Date(date_of_joining) : null,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            current_address,
            permanent_address,
            emergency_contact_name,
            emergency_contact_mobile,
            emergency_contact_relation,
            emergency_contact_address,
            status,
            employment: uniqueEmployeeId,
          },
        },
      },
    });

    res.status(201).json({ message: "Staff created successfully!", user });
  } catch (error) {
    // console.log(error);
    res.status(500).json({
      error: "Failed to create staff member",
      details: error.message,
    });
  }
};

const updateStaff = async (req, res) => {
  const { id } = req.params;

  // Validate incoming data
  const validation = staffSchema.partial().safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data format",
      message: validation.error.issues[0].message,
    });
  }

  try {
    const {
      job_title,
      departmentId,
      branchId,
      roleId,
      mobile,
      login_otp,
      gender,
      guardian_name,
      blood_group,
      marital_status,
      official_email,
      date_of_joining,
      date_of_birth,
      current_address,
      permanent_address,
      emergency_contact_name,
      emergency_contact_mobile,
      emergency_contact_relation,
      emergency_contact_address,
      name,
      status,
      employment,
    } = validation.data;

    console.log("Incoming Data:", validation.data);

    // Ensure date fields are properly formatted
    const formattedDateOfJoining = date_of_joining ? new Date(date_of_joining).toISOString() : undefined;
    const formattedDateOfBirth = date_of_birth ? new Date(date_of_birth).toISOString() : undefined;

    console.log("Formatted Dates:", {
      date_of_joining: formattedDateOfJoining,
      date_of_birth: formattedDateOfBirth,
    });

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: official_email }, { mobile: mobile }],
      },
    });

    // Update user details
    await prisma.user.update({
      where: { id: id },
      data: { name, mobile },
    });

    // Construct update data, excluding undefined values
    const updateData = {
      job_title,
      branchId,
      departmentId,
      roleId,
      login_otp,
      gender,
      official_email,
      current_address,
      permanent_address,
      emergency_contact_name,
      emergency_contact_mobile,
      emergency_contact_relation,
      emergency_contact_address,
      status,
      employment,
      marital_status,
      blood_group,
      guardian_name,
      employee_type: req.body.employee_type,
      employee_id: req.body.employee_id,
      date_of_leaving: req.body.date_of_leaving,
      esi_number: req.body.esi_number,
      pf_number: req.body.pf_number,
    };

    // Add dates only if they exist
    if (formattedDateOfJoining) updateData.date_of_joining = formattedDateOfJoining;
    if (formattedDateOfBirth) updateData.date_of_birth = formattedDateOfBirth;

    console.log("Final Update Data:", updateData);

    // Update staff details
    const updatedStaff = await prisma.staffDetails.update({
      where: { userId: id },
      data: updateData,
    });

    return res.status(200).json(updatedStaff);
  } catch (error) {
    console.error("Error Updating Staff:", error);
    return res.status(500).json({
      error: "Failed to update staff member",
      details: error.message,
    });
  }
};


async function getAllStaff(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Convert query parameters to integers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Calculate the number of records to skip
    const skip = (pageNum - 1) * limitNum;
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
      return res.status(400).json({ message: "Only admin can get staff!" });
    }
    const staffs = await prisma.user.findMany({
      where: {
        role: "STAFF",
        adminId: req.userId,
      },
      include: {
        staffDetails: {
          where: {
            status: true, // Add condition for true status in staffDetails
          },
          include: {
            branch: true,
            department: true,
            role: true,
            BankDetails: true,
            LeavePolicy: true,
            LeaveBalance: true,
            LeaveRequest: true,
            FixedShift: {
              include: {
                shifts: true,
              },
            },
            FlexibleShift: {
              include: {
                shifts: true,
              },
            },
            OverLeavePolicy: true,
            EarlyLeavePolicy: true,
            LateComingPolicy: true,
            EmployerContribution: true,
            EmployeeContribution: true,
            SalaryDetails: {
              orderBy: {
                effective_date: "desc", // Order by the latest effective_date first
              },
              include: {
                PaymentHistory: true,
                Incentive: true,
                Reimbursement: true,
                employeeContribution: true,
                employerContribution: true,
                deductions: true,
                earnings: true,
              }
            },
            PunchRecords: true,
            attendanceAutomationRule: true,
            AttendenceMode: true,
            staff_bg_verification: true,
            CustomDetails: true,
            TicketInformation: true,
            UpiDetails: true,
            WorkEntry: true,
            Earning: true,
            Deduction: true,
            projects: true,
            past_Employment: true,
            Fine: true,
            Overtime: true,
          },
        },
      },
      skip,
      take: limitNum,
    });

    // Get the total count of staff members
    const totalStaffs = await prisma.user.count({
      where: {
        role: "STAFF",
        adminId: req.userId,
      },
    });

    // Prepare metadata for the response
    const totalPages = Math.ceil(totalStaffs / limitNum);

    return res.status(200).json({
      message: "Staff members fetched successfully",
      data: staffs,
      meta: {
        currentPage: pageNum,
        totalPages,
        totalRecords: totalStaffs,
        recordsPerPage: limitNum,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch staff members",
      details: error.message,
    });
  }
}

const getStaffById = async (req, res) => {
  try {
    const staff = await prisma.user.findFirst({
      where: {
        id: req.userId,
      },
      include: {
        staffDetails: {
          include: {
            branch: true,
            department: true,
            role: true,
            BankDetails: true,
            LeavePolicy: true,
            LeaveBalance: true,
            LeaveRequest: true,
            FixedShift: true,
            FlexibleShift: true,
            OverLeavePolicy: true,
            EarlyLeavePolicy: true,
            LateComingPolicy: true,
            SalaryDetails: {
              orderBy: {
                effective_date: "desc", // Order by the latest effective_date first
              },
              include: {
                PaymentHistory: true,
                Incentive: true,
                Reimbursement: true,
                employeeContribution: true,
                employerContribution: true,
                deductions: true,
                earnings: true,
              }
            },
            PunchRecords: true,
            attendanceAutomationRule: true,
            AttendenceMode: true,
            staff_bg_verification: true,
            CustomDetails: true,
            TicketInformation: true,
            UpiDetails: true,
            WorkEntry: true,
            Earning: true,
            Deduction: true,
            projects: true,
            EmployerContribution: true,
            EmployeeContribution: true,
            ProjectPriority: true,
            past_Employment: true,
            TaskStatus: true,
          },
        },
      },
    });
    if (staff) {
      res.status(200).json(staff);
    } else {
      res.status(404).json({ error: "Staff member not found" });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch staff member",
      details: error.message,
    });
  }
};

// Delete staff in bulk
const deleteStaffInBulk = async (req, res) => {
  try {
    const { ids } = req.body; // `ids` refers to staffDetails IDs

    // Check if ids are provided
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or missing 'ids' in request body" });
    }

    // Find the admin
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    // Verify admin exists
    if (!admin) {
      return res.status(400).json({ message: "Admin not found!" });
    }

    // Verify admin role
    if (admin.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only admin can delete staff in bulk!" });
    }

    // Fetch the user IDs linked to the provided staffDetails IDs
    const staffDetails = await prisma.staffDetails.findMany({
      where: {
        id: { in: ids },
      },
      select: { userId: true },
    });

    // Extract user IDs from the result
    const userIds = staffDetails.map((detail) => detail.userId);

    if (userIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for the provided staffDetails IDs" });
    }

    // Delete users and their associated staff details
    await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });

    res.status(200).json({
      message: "Staff members and their associated users deleted successfully",
      deletedCount: userIds.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete staff members and users",
      details: error.message,
    });
  }
};

const deleteStaff = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(201).json({ message: "Staff member deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete staff member",
      details: error.message,
    });
  }
};

// Search staff by name department and date
const searchStaffByName = async (req, res) => {
  try {
    const {
      name,
      department,
      date_of_joining,
      role,
      gender,
      page = 1,
      limit = 10,
    } = req.query;

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
      return res.status(400).json({ message: "Only admin can create client!" });
    }

    // console.log(req.query);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Parse date_of_joining if provided and normalize to YYYY-MM-DD
    const joiningDate = date_of_joining
      ? new Date(date_of_joining).toISOString().split("T")[0] // Extract only the date part
      : undefined;

    // Fetch paginated staff
    const searchStaff = await prisma.user.findMany({
      where: {
        adminId: req.userId,
        role: "STAFF",
        AND: [{ adminId: req.userId }, { adminId: { not: null } }],
        name:
          name !== "" && name !== undefined
            ? {
              contains: name,
              mode: "insensitive",
            }
            : undefined,
        staffDetails: {
          departmentId:
            department !== ""
              ? {
                contains: department,
                mode: "insensitive",
              }
              : undefined,
          date_of_joining: date_of_joining
            ? {
              equals: new Date(date_of_joining).toISOString(), // Ensure exact date match with time reset
            }
            : undefined,
          gender:
            gender !== "" && gender !== undefined
              ? { contains: gender }
              : undefined,
          roleId:
            role !== ""
              ? {
                contains: role,
                mode: "insensitive",
              }
              : undefined,
        },
      },
      include: {
        staffDetails: {
          include: {
            department: true,
          },
        },
      },
      skip,
      take: limitNum,
    });

    // Count total matching staff members
    const totalStaff = await prisma.user.count({
      where: {
        role: "STAFF",
        adminId: req.userId,
        name:
          name !== "" && name !== undefined
            ? {
              contains: name,
              mode: "insensitive",
            }
            : undefined,
        staffDetails: {
          departmentId:
            department !== ""
              ? {
                contains: department,
                mode: "insensitive",
              }
              : undefined,
          date_of_joining: date_of_joining
            ? {
              equals: new Date(date_of_joining).toISOString(), // Ensure exact date match with time reset
            }
            : undefined,
          roleId:
            role !== ""
              ? {
                contains: role,
                mode: "insensitive",
              }
              : undefined,
          gender:
            gender !== "" && gender !== undefined
              ? { contains: gender }
              : undefined,
        },
      },
    });

    return res.status(200).json({
      data: searchStaff,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalStaff / limitNum),
        totalRecords: totalStaff,
      },
    });
  } catch (error) {
    console.error("Error fetching staff members:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to search staff members: " + error.message,
    });
  }
};

// Search staff by status gender employment
const searchStaffByStatus = async (req, res) => {
  const { status, gender, employment, page = 1, limit = 10 } = req.query;

  try {
    // Convert pagination values to integers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Filter criteria object
    const whereDataArray = {
      AND: [
        { User: { adminId: req.userId } },
        { User: { admin: { not: null } } },
      ],
    };

    if (status) {
      whereDataArray.status = {
        contains: status.trim(),
        mode: "insensitive",
      };
    }

    if (gender) {
      whereDataArray.gender = {
        contains: gender.trim(),
        mode: "insensitive",
      };
    }

    if (employment) {
      whereDataArray.employment = {
        contains: employment.trim(),
        mode: "insensitive",
      };
    }

    // Fetch paginated data
    const filteredData = await prisma.staffDetails.findMany({
      where: whereDataArray,
      skip,
      take: limitNum,
    });

    // Count total matching records
    const totalRecords = await prisma.staffDetails.count({
      where: whereDataArray,
    });

    // Return response with pagination metadata
    return res.status(200).json({
      data: filteredData,
      meta: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Failed to search staff members:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to search staff members: " + error,
    });
  }
};

const applyFineAndOvertime = async (req, res) => {
  try {
    const { data } = req.body;
    const adminId = req.userId;
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) {
      return res.status(400).json({
        message: "Admin not found!",
      });
    }
    if (admin.role !== "ADMIN") {
      return res.status(400).json({ message: "Only admin can apply fine!" });
    }

    for (let d of data) {
      await prisma.staffDetails.update({
        where: {
          id: d.id,
          status: true,
        },
        data: {
          applyFine: d.fine ?? false,
          applyOvertime: d.overtime ?? false,
        },
      });
    }
    res
      .status(200)
      .json({ message: "Fine and overtime applied successfully!" });
  } catch (error) {
    console.error("Failed to apply fine and overtime:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to apply fine and overtime: " + error,
    });
  }
};

// Update Status Active or Inactive

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

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
      return res.status(400).json({ message: "Only admin can update status!" });
    }
    await prisma.staffDetails.update({
      where: { id: id },
      data: { status },
    });
    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

async function getStaffByDateOfBirth(req, res) {
  try {
    const { page = 1, limit = 10, month } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Map month names to their corresponding indices
    const monthMap = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    // Fetch the requesting user (admin)
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found!" });
    }

    if (admin.role !== "ADMIN") {
      return res.status(400).json({ message: "Only admin can get staff!" });
    }

    // Fetch all staff members
    const allStaff = await prisma.user.findMany({
      where: {
        role: "STAFF",
        adminId: req.userId,
      },
      include: {
        staffDetails: {
          include: {
            department: true,
            role: true,
          },
        },
      },
    });

    // Filter staff members based on the selected month (if provided)
    let staffMembers;
    if (month) {
      const selectedMonth = monthMap[month];
      if (selectedMonth === undefined) {
        return res.status(400).json({
          message:
            "Invalid month! Please provide the first three letters of the month (e.g., Jan, Feb, etc.).",
        });
      }

      staffMembers = allStaff.filter((staff) => {
        if (!staff.staffDetails || !staff.staffDetails.date_of_birth)
          return false;
        const dob = new Date(staff.staffDetails.date_of_birth);
        return dob.getMonth() === selectedMonth;
      });
    } else {
      // If no month is provided, return all staff members
      staffMembers = allStaff;
    }

    // Pagination
    const totalStaffs = staffMembers.length;
    const paginatedStaff = staffMembers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalStaffs / limitNum);

    // Postman-friendly response
    return res.status(200).json({
      message: "No birthday found this month.",
      data: paginatedStaff.map((staff) => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        date_of_birth: staff.staffDetails?.date_of_birth,
        department: staff.staffDetails?.department,
        role: staff.staffDetails?.role,
      })),
      meta: {
        currentPage: pageNum,
        totalPages,
        totalRecords: totalStaffs,
        recordsPerPage: limitNum,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch staff members",
      details: error.message,
    });
  }
}

// async function getStaffByDateOfBirth(req, res) {
//   try {
//     const { page = 1, limit = 10, month } = req.query;
//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     // Fetch the requesting user (admin)
//     const admin = await prisma.user.findUnique({
//       where: { id: req.userId },
//     });

//     if (!admin) {
//       return res.status(400).json({ message: "Admin not found!" });
//     }

//     if (admin.role !== "ADMIN") {
//       return res.status(400).json({ message: "Only admin can get staff!" });
//     }

//     // Fetch all staff members
//     const allStaff = await prisma.user.findMany({
//       where: {
//         role: "STAFF",
//         adminId: req.userId,
//       },
//       include: {
//         staffDetails: {
//           include: {
//             department: true,
//             role: true,
//           },
//         },
//       },
//     });

//     // Filter staff members based on the selected month (if provided)
//     let staffMembers;
//     if (month) {
//       const selectedMonth = parseInt(month, 10) - 1; // Month is zero-indexed in JavaScript Date
//       if (isNaN(selectedMonth) || selectedMonth < 0 || selectedMonth > 11) {
//         return res
//           .status(400)
//           .json({ message: "Invalid month! Please provide a value between 1 and 12." });
//       }

//       staffMembers = allStaff.filter((staff) => {
//         if (!staff.staffDetails || !staff.staffDetails.date_of_birth) return false;
//         const dob = new Date(staff.staffDetails.date_of_birth);
//         return dob.getMonth() === selectedMonth;
//       });
//     } else {
//       // If no month is provided, return all staff members
//       staffMembers = allStaff;
//     }

//     // Pagination
//     const totalStaffs = staffMembers.length;
//     const paginatedStaff = staffMembers.slice(skip, skip + limitNum);
//     const totalPages = Math.ceil(totalStaffs / limitNum);

//     // Postman-friendly response
//     return res.status(200).json({
//       message: "Staff members fetched successfully",
//       data: paginatedStaff.map((staff) => ({
//         id: staff.id,
//         name: staff.name,
//         email: staff.email,
//         phone: staff.phone,
//         date_of_birth: staff.staffDetails?.date_of_birth,
//         department: staff.staffDetails?.department,
//         role: staff.staffDetails?.role,
//       })),
//       meta: {
//         currentPage: pageNum,
//         totalPages,
//         totalRecords: totalStaffs,
//         recordsPerPage: limitNum,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       error: "Failed to fetch staff members",
//       details: error.message,
//     });
//   }
// }

// get staff count

const getStaffCount = async (req, res) => {
  try {
    // Fetch admin details from the database
    const admin = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    // Check if admin exists
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!",
      });
    }

    // Verify if the user has admin privileges
    if (admin.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can get the staff count!",
      });
    }

    // Fetch the count of staff members
    const staffCount = await prisma.user.count({
      where: {
        role: "STAFF",
        adminId: req.userId,
      },
    });

    // Send a success response with the count
    return res.status(200).json({
      message: "Successfully fetched staff count",
      count: staffCount,
    });
  } catch (error) {
    console.error("Failed fetching staff count:", error);
    return res.status(500).json({
      error: "Failed to fetch staff count",
      details: error.message,
    });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  searchStaffByName,
  deleteStaff,
  searchStaffByStatus,
  deleteStaffInBulk,
  applyFineAndOvertime,
  updateStatus,
  getStaffByDateOfBirth,
  getStaffCount,
};
