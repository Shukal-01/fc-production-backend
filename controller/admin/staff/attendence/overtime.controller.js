const { PrismaClient } = require("@prisma/client");
const { OverTimeSchema } = require("../../../../utils/validations");
const prisma = new PrismaClient();

const addOvertimeData = async (req, res) => {
    const {
        staffId,
        punchRecordId,
        earlyCommingEntryHoursTime,
        lateOutOvertimeHoursTime,
        earlyCommingEntryAmount,
        earlyEntryAmount,
        lateOutOvertimeAmount,
        lateOutAmount,
        totalAmount,
        shiftIds,
    } = req.body;

    const validation = OverTimeSchema.safeParse({
        staffId,
        earlyCommingEntryAmount,
        earlyEntryAmount,
        lateOutOvertimeAmount,
        lateOutAmount,
        totalAmount,
        shiftIds,
    });
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.issues[0].message });
    }

    // Validate input
    if (!staffId && !punchRecordId) {
        return res.status(400).json({ message: "staffId and punchRecordId are required." });
    }

    try {
        // Check if the punchRecordId exists
        let punchRecord = await prisma.punchRecords.findFirst({
            where: { id: punchRecordId, staffId },
        });

        if (!punchRecord) {
            // If not found, create a new punch record
            punchRecord = await prisma.punchRecords.create({
                data: { staffId, status: "ABSENT" },
            });
        }

        // Check if an overtime record exists for the given punchRecordId
        const existingOvertime = await prisma.overtime.findFirst({
            where: { punchRecordId: punchRecord.id },
        });

        if (existingOvertime) {
            // If overtime record exists, update it with new data
            const overtime = await prisma.overtime.update({
                where: { id: existingOvertime.id }, // Use the existing overtime's ID to update
                data: {
                    earlyCommingEntryAmount,
                    earlyCommingEntryHoursTime,
                    lateOutOvertimeHoursTime,
                    earlyEntryAmount,
                    lateOutOvertimeAmount,
                    lateOutAmount,
                    totalAmount,
                    shiftIds: JSON.stringify(shiftIds), // Convert to JSON string
                },
            });

            return res.status(200).json({ message: "Overtime updated successfully", overtime });
        }

        // If no overtime record exists, create a new one
        const overtime = await prisma.overtime.create({
            data: {
                staffId,
                punchRecordId: punchRecord.id,
                earlyCommingEntryHoursTime,
                lateOutOvertimeHoursTime,
                earlyCommingEntryAmount,
                earlyEntryAmount,
                lateOutOvertimeAmount,
                lateOutAmount,
                totalAmount,
                shiftIds: JSON.stringify(shiftIds), // Convert to JSON string
            },
        });

        return res.status(201).json({ message: "Overtime created successfully", overtime });
    } catch (error) {
        console.error("Failed to add or update overtime:", error.message);
        res.status(500).json({ message: "Failed to add or update overtime", error: error.message });
    }
};



const updateMultipleOvertimeData = async (req, res) => {
    try {
        const { OvertimeUpdates } = req.body;

        // Validate input
        if (!Array.isArray(OvertimeUpdates) || OvertimeUpdates.length === 0) {
            return res
                .status(400)
                .json({ error: "Please provide valid overtime updates" });
        }

        // Prepare update promises for each overtime record
        const updatePromises = OvertimeUpdates.map((overtime) => {
            if (!overtime.id) {
                throw new Error("Each overtime update must include a valid ID.");
            }

            return prisma.overtime.update({
                where: { id: overtime.id },
                data: {
                    earlyCommingEntryAmount: overtime.earlyCommingEntryAmount,
                    earlyCommingEntryHoursTime: overtime.earlyCommingEntryHoursTime,
                    lateOutOvertimeHoursTime: overtime.lateOutOvertimeHoursTime,
                    earlyEntryAmount: overtime.earlyEntryAmount,
                    lateOutOvertimeAmount: overtime.lateOutOvertimeAmount,
                    lateOutAmount: overtime.lateOutAmount,
                    totalAmount: overtime.totalAmount,
                    shiftIds: overtime.shiftIds,
                },
            });
        });

        // Execute all updates
        const updatedOvertimes = await Promise.all(updatePromises);

        // Respond with updated records
        res
            .status(200)
            .json({ message: "Overtime records updated successfully", data: updatedOvertimes });
    } catch (error) {
        console.error("Error updating overtime data:", error);
        res
            .status(500)
            .json({ message: "Error updating overtime records: " + error.message });
    }
};

// get all overtime data

const getOvertimeAll = async (req, res) => {
    try {
        const overtimeData = await prisma.overtime.findMany();
        res.status(200).json({ message: "Overtime data retrieved successfully", data: overtimeData });
    } catch (error) {
        console.error("Error retrieving overtime data:", error);
        res.status(500).json({ message: "Error retrieving overtime records: " + error.message })
    }
};

module.exports = { addOvertimeData, updateMultipleOvertimeData, getOvertimeAll };
