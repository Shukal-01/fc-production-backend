const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { attendanceModeSchema } = require("../../../../utils/validations.js");

// fetch attendance mode configuaration for all staff
const fetchAttendenceModeForAllStaff = async (req, res) => {
    try {
        const allAttendenceModeOfStaff = await prisma.attendanceMode.findMany({
        });
        res.status(200).json({
            message: "Fetch all attendence mode for staff successfully",
            data: allAttendenceModeOfStaff
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch all attendence mode for staff",
        });
    }
}

// update or crate attendance mode configuaration for single or multiple staff
const addAndUpdateAttendenceModeForStaffs = async (req, res) => {
    let { staff_ids, attendence_mode = {} } = req.body;

    const {
        selfie_attendance,
        qr_attendance,
        gps_attendance,
        mark_attendance,
        allow_punch_in_for_mobile
    } = attendence_mode;

    try {
        if (!staff_ids || staff_ids.length === 0) {
            const staffIds = await prisma.staffDetails.findMany({
                select: {
                    id: true,
                },
            })
            staff_ids = staffIds.map(staff => staff.id);
        }
        const validateAttendenceMode = attendanceModeSchema.safeParse(attendence_mode);
        if (!validateAttendenceMode.success) {
            return res.status(400).json({
                error: validateAttendenceMode.error,
            })
        }

        const updatePromises = staff_ids.map(async (staff_id) => {
            return await prisma.attendanceMode.upsert({
                where: { staffId: staff_id },
                update: {
                    selfie_attendance: selfie_attendance,
                    qr_attendance: qr_attendance,
                    gps_attendance: gps_attendance,
                    mark_attendance: mark_attendance,
                    allow_punch_in_for_mobile: allow_punch_in_for_mobile,

                },
                create: {
                    staffId: staff_id,
                    selfie_attendance: selfie_attendance,
                    qr_attendance: qr_attendance,
                    gps_attendance: gps_attendance,
                    mark_attendance: mark_attendance,
                    allow_punch_in_for_mobile: allow_punch_in_for_mobile,
                }
            });
        });

        // Wait for all updates to complete
        const updatedAutomationRules = await Promise.all(updatePromises);

        // Log success response
        // console.log("Create or update mode:", updatedAutomationRules);

        // Send a success response
        res.status(200).json({
            message: "Attendance mode created or updated for staffIds successfully.",
            data: updatedAutomationRules,
        });
    } catch (error) {
        console.error("Error in creating or updating attendance mode for staffIds:", error);
        res.status(500).json({
            error: "Failed to create or update attendance mode for staffIds: " + error.message,
        });
    }
};

module.exports = {
    fetchAttendenceModeForAllStaff,
    addAndUpdateAttendenceModeForStaffs,
};