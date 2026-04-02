// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();


// async function createPenaltyOvertimeDetails(req, res) {
//     try {
//         const { earlyLeavePolicy, lateComingPolicy, overtimePolicy, staffId } = req.body;

//         const newPenaltyOvertimeDetails = await prisma.panaltyOvertimeDetails.create({
//             data: {
//                 earlyLeavePolicyId: earlyLeavePolicy,
//                 lateComingPolicyId: lateComingPolicy,
//                 overtimePolicyId: overtimePolicy,
//                 staffId,
//             },
//         });

//         res.status(201).json(newPenaltyOvertimeDetails);
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ error: "Failed to create PenaltyOvertimeDetails" });
//     }
// }

// async function getAllPenaltyOvertimeDetails(req, res) {
//     try {
//         const penaltyOvertimeDetails = await prisma.panaltyOvertimeDetails.findMany();
//         res.status(200).json(penaltyOvertimeDetails);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: "Failed to fetch penaltyOvertimeDetails" });
//     }
// }

// async function getPenaltyOvertimeDetailsById(req, res) {
//     const { id } = req.params;
//     try {
//         const penaltyOvertimeDetails = await prisma.panaltyOvertimeDetails.findUnique({
//             where: { id },
//             include: {
//                 staff: true,
//                 earlyLeavePolicy: true,
//                 lateComingPolicy: true,
//                 overtimePolicy: true,
//             },
//         });
//         if (!penaltyOvertimeDetails) {
//             return res.status(404).json({ error: "PenaltyOvertimeDetails not found" });
//         }
//         res.status(200).json(penaltyOvertimeDetails);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: "Failed to fetch penaltyOvertimeDetails" });
//     }
// }

// async function updatePenaltyOvertimeDetails(req, res) {
//     const { id } = req.params;
//     const { staffId, earlyLeavePolicyId, lateComingPolicyId, overtimePolicyId } = req.body;
//     try {
//         const updatedPenaltyOvertimeDetails = await prisma.panaltyOvertimeDetails.update({
//             where: { id },
//             data: {
//                 staffId,
//                 earlyLeavePolicyId,
//                 lateComingPolicyId,
//                 overtimePolicyId,
//             },
//         });
//         res.status(200).json(updatedPenaltyOvertimeDetails);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: "Failed to update penaltyOvertimeDetails" });
//     }
// }

// module.exports = {
//     createPenaltyOvertimeDetails,
//     getAllPenaltyOvertimeDetails,
//     getPenaltyOvertimeDetailsById,
//     updatePenaltyOvertimeDetails,
// }