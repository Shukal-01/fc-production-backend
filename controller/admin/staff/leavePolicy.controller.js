const { PrismaClient } = require("@prisma/client");
const {
  leavePolicySchema,
  bulkLeavePolicySchema,
} = require("../../../utils/validations");
const { z } = require("zod");
const prisma = new PrismaClient();

exports.createLeavePolicy = async (req, res) => {
  try {
    const staffId = req.params.id;

    const validation = leavePolicySchema.safeParse({
      ...req.body,
      staffId,
    });
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0].message,
      });
    }
    const parsedData = validation.data;

    const leavePolicy = await prisma.leavePolicy.create({
      data: {
        staffId: parsedData.staffId,
        name: parsedData.name,
        allowed_leaves: parsedData.allowed_leaves,
        carry_forward_leaves: parsedData.carry_forward_leaves,
        policy_type: parsedData.policy_type,
        leaveBalance: {
          create: {
            staffId: parsedData.staffId,
            balance: parsedData.allowed_leaves,
            used: 0,
          },
        },
      },
      include: {
        leaveBalance: true,
      },
    });

    res.status(201).json(leavePolicy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating leave policy:", error);
    res.status(500).json({ error: "Failed to create leave policy" });
  }
};

exports.getLeavePoliciesByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const leavePolicies = await prisma.leavePolicy.findMany({
      where: { staffId },
      include: { leaveBalance: true },
    });

    if (!leavePolicies.length) {
      return res
        .status(404)
        .json({ error: "No leave policies found for this staff" });
    }

    res.status(200).json(leavePolicies);
  } catch (error) {
    console.error("Error fetching leave policies:", error);
    res.status(500).json({ error: "Failed to fetch leave policies" });
  }
};

exports.updateLeavePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const validation = leavePolicySchema.safeParse({
      ...req.body,
    });
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0].message,
      });
    }

    const parsedData = validation.data;
    const updatedPolicy = await prisma.leavePolicy.update({
      where: { id },
      data: {
        name: parsedData.name,
        allowed_leaves: parsedData.allowed_leaves,
        carry_forward_leaves: parsedData.carry_forward_leaves,
        policy_type: parsedData.policy_type,
        leaveBalance: {
          update: {
            balance: parsedData.allowed_leaves,
          },
        },
      },
      include: { leaveBalance: true },
    });

    res.status(200).json(updatedPolicy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating leave policy:", error);
    res.status(500).json({ error: "Failed to update leave policy" });
  }
};

exports.updateLeaveBalance = async (req, res) => {
  try {
    const { data } = req.body;

    for (leave of data) {
      const { id } = leave;
      const updatedPolicy = await prisma.leavePolicy.update({
        where: { id },
        data: {
          leaveBalance: {
            update: {
              balance: leave.balance,
            },
          },
        },
      });
    }

    res.status(200).json({ message: "Leave balance updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating leave policy:", error);
    res.status(500).json({ error: "Failed to update leave policy" });
  }
};

exports.deleteLeavePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.leavePolicy.delete({
      where: { id },
    });

    res.status(200).json({ message: "Leave policy deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave policy:", error);
    res.status(500).json({ error: "Failed to delete leave policy" });
  }
};

exports.createBulkLeavePolicy = async (req, res) => {
  try {
    let { staffIds, ...rest } = req.body;

    // Validate the policy data
    const validation = bulkLeavePolicySchema.safeParse(rest);
    if (!validation.success) {
      return res.status(400).json({
        status: false,
        message: validation.error.issues[0].message,
      });
    }
    const parsedData = validation.data;

    // Get all staff IDs if not provided in the request
    if (!staffIds || staffIds.length === 0) {
      const allStaff = await prisma.staffDetails.findMany({
        select: {
          id: true,
        },
      });
      staffIds = allStaff.map((staff) => staff.id);
    }
    // Process create or update policies using Promise.all
    const upsertedPolicies = await Promise.all(
      staffIds.map(async (staffId) => {
        // Check if a policy already exists for the given staffId
        const existingPolicy = await prisma.leavePolicy.findFirst({
          where: {
            staffId: staffId,
          },
          include: {
            leaveBalance: true,
          },
        });

        if (existingPolicy) {
          // Update the existing policy
          await prisma.leaveBalance.update({
            where: { id: existingPolicy.leaveBalance.id },
            data: {
              balance: parsedData.allowed_leaves,
              used: 0, // Reset used leave
            },
          });

          return prisma.leavePolicy.update({
            where: {
              id: existingPolicy.id,
            },
            data: {
              name: parsedData.name,
              allowed_leaves: parsedData.allowed_leaves,
              carry_forward_leaves: parsedData.carry_forward_leaves,
              policy_type: parsedData.policy_type,
            },
          });
        } else {
          // Create a new policy
          return prisma.leavePolicy.create({
            data: {
              staffId: staffId,
              name: parsedData.name,
              allowed_leaves: parsedData.allowed_leaves,
              carry_forward_leaves: parsedData.carry_forward_leaves,
              policy_type: parsedData.policy_type,
              leaveBalance: {
                create: {
                  staffId: staffId,
                  balance: parsedData.allowed_leaves,
                  used: 0,
                },
              },
            },
            include: { leaveBalance: true },
          });
        }
      })
    );

    res.status(201).json({
      message: "Leave policies created or updated successfully",
      data: upsertedPolicies,
    });

  } catch (error) {
    console.error("Error creating or updating leave policies:", error);
    res.status(500).json({ error: "Failed to create or update leave policies" });
  }
};
