const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const EarlyLeavePolicySchema =
  require("../../utils/validations").EarlyLeavePolicySchema;
const { ZodError } = require("zod");
const LateComingPolicySchema =
  require("../../utils/validations").LateComingPolicySchema;
const OvertimePolicySchema =
  require("../../utils/validations").OvertimePolicySchema;

async function getAllEarlyLeavePolicy(req, res) {
  try {
    const policies = await prisma.earlyLeavePolicy.findMany();
    res.status(200).json(policies);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to get policies" });
  }
}

async function createEarlyLeavePolicy(req, res) {
  try {
    const { fineType, gracePeriodMins, fineAmountMins, waiveOffDays, staffId } =
      req.body;

    // Validate the input using Zod
    const earlyLeavePolicyResult = EarlyLeavePolicySchema.safeParse({
      fineType,
      gracePeriodMins,
      fineAmountMins,
      waiveOffDays,
      staffId,
    });

    if (!earlyLeavePolicyResult.success) {
      // Return the validation error
      return res.status(400).json({
        error: earlyLeavePolicyResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    // Create the policy in the database
    const newEarlyLeavePolicy = await prisma.earlyLeavePolicy.create({
      data: earlyLeavePolicyResult.data,
    });

    // Return the created policy
    res.status(201).json(newEarlyLeavePolicy);
  } catch (error) {
    if (error.code === "P2002") {
      // Handle unique constraint violation (e.g., duplicate staffId)
      res
        .status(409)
        .json({ error: "A policy already exists for this staff ID." });
    } else {
      console.error(error);
      res.status(500).json({ error: "Failed to create Early Leave Policy." });
    }
  }
}

async function getAllLateComingPolicy(req, res) {
  try {
    const policies = await prisma.lateComingPolicy.findMany();
    res.status(200).json(policies);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to get policies" });
  }
}

async function updateEarlyLeavePolicyByStaffId(req, res) {
  try {
    const { staffId } = req.params;
    const { fineType, gracePeriodMins, fineAmountMins, waiveOffDays } =
      req.body;

    // Validate the input using Zod
    const earlyLeavePolicyResult = EarlyLeavePolicySchema.safeParse({
      fineType,
      gracePeriodMins,
      fineAmountMins,
      waiveOffDays,
      staffId,
    });

    if (!earlyLeavePolicyResult.success) {
      // Return the validation error
      return res.status(400).json({
        error: earlyLeavePolicyResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    // Update the policy in the database
    const updatedEarlyLeavePolicy = await prisma.earlyLeavePolicy.update({
      where: { staffId },
      data: earlyLeavePolicyResult.data,
    });

    // Return the updated policy
    res.status(200).json(updatedEarlyLeavePolicy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update Early Leave Policy." });
  }
}

async function createLateComingPolicy(req, res) {
  try {
    const { fineType, gracePeriodMins, fineAmountMins, waiveOffDays, staffId } =
      req.body;

    const lateComingPolicyResult = LateComingPolicySchema.safeParse([
      { fineType, gracePeriodMins, fineAmountMins, waiveOffDays, staffId },
    ]);

    if (!lateComingPolicyResult.success) {
      // Validation failed
      return res
        .status(400)
        .json({ error: lateComingPolicyResult.error.issues[0].message });
    }

    // Prisma expects an object, not an array
    const validatedData = lateComingPolicyResult.data[0];

    // Create the policy in the database
    const newLateComingPolicy = await prisma.lateComingPolicy.create({
      data: validatedData,
    });

    res.status(201).json(newLateComingPolicy);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request data" });
    } else {
      console.error(error);
      res.status(500).json({ error: "Failed to create Late Coming Policy" });
    }
  }
}

async function getAllOvertimePolicy(req, res) {
  try {
    const policies = await prisma.overtimePolicy.findMany();
    res.status(200).json(policies);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to get policies" });
  }
}

async function updateLateComingPolicyByStaffId(req, res) {
  try {
    const { staffId } = req.params;
    const { fineType, gracePeriodMins, fineAmountMins, waiveOffDays } =
      req.body;

    const lateComingPolicyResult = LateComingPolicySchema.safeParse([
      { fineType, gracePeriodMins, fineAmountMins, waiveOffDays, staffId },
    ]);

    if (!lateComingPolicyResult.success) {
      // Validation failed
      return res
        .status(400)
        .json({ error: lateComingPolicyResult.error.issues[0].message });
    }

    // Prisma expects an object, not an array
    // const validatedData = lateComingPolicyResult.data[0];

    // Update the policy in the database
    const updatedLateComingPolicy = await prisma.lateComingPolicy.update({
      where: { staffId },
      // data: validatedData,
      data: lateComingPolicyResult.data[0],
    });

    res.status(200).json(updatedLateComingPolicy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update Late Coming Policy" });
  }
}

async function createOvertimePolicy(req, res) {
  try {
    // Ensure req.body is a plain object and validate with schema
    const overtimePolicyResult = OvertimePolicySchema.safeParse(req.body);

    if (!overtimePolicyResult.success) {
      return res.status(400).json({
        error: overtimePolicyResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    const newOvertimePolicy = await prisma.overtimePolicy.create({
      data: overtimePolicyResult.data, // Single object
    });

    res.status(201).json(newOvertimePolicy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create Overtime Policy" });
  }
}

async function updateOvertimePoicyByStaffId(req, res) {
  try {
    const { staffId } = req.params;
    const { gracePeriodMins, extraHoursPay, publicHolidayPay, weekOffPay } =
      req.body;

    const overtimePolicyResult = OvertimePolicySchema.safeParse({
      gracePeriodMins,
      extraHoursPay,
      publicHolidayPay,
      weekOffPay,
      staffId,
    });

    if (!overtimePolicyResult.success) {
      return res.status(400).json({
        error: overtimePolicyResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    const updatedOvertimePolicy = await prisma.overtimePolicy.update({
      where: { staffId },
      data: overtimePolicyResult.data,
    });

    res.status(200).json(updatedOvertimePolicy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update Overtime Policy" });
  }
}

async function createBulkOvertimePayPolicies(req, res) {
  try {
    const {
      staffIds,
      gracePeriodMins,
      extraHoursPay,
      publicHolidayPay,
      weekOffPay,
    } = req.body;

    const validationResult = OvertimePolicySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: validationResult.error.issues[0].message,
      });
    }

    // Loop through staffIds and create or update overtime policies
    const upsertedPolicies = await Promise.all(
      staffIds.map(async (staffId) => {
        const existingPolicy = await prisma.overtimePolicy.findFirst({
          where: { staffId },
        });

        if (existingPolicy) {
          // Update the existing policy
          return prisma.overtimePolicy.update({
            where: { id: existingPolicy.id },
            data: {
              gracePeriodMins,
              extraHoursPay,
              publicHolidayPay,
              weekOffPay,
            },
          });
        } else {
          // Create a new policy
          return prisma.overtimePolicy.create({
            data: {
              staffId,
              gracePeriodMins,
              extraHoursPay,
              publicHolidayPay,
              weekOffPay,
            },
          });
        }
      })
    );
    res.status(201).json({
      message: "Overtime policies created or updated successfully",
      data: upsertedPolicies,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to create or update Overtime Policies" });
  }
}

async function createBulkLateComingPolicies(req, res) {
  try {
    const data = req.body;

    // Validate input using Zod schema
    const lateComingPolicyResult = LateComingPolicySchema.safeParse(data);

    if (!lateComingPolicyResult.success) {
      return res.status(400).json({
        message: lateComingPolicyResult.error.issues[0].message,
      });
    }

    const {
      staffIds,
      fineType,
      gracePeriodMins,
      fineAmountMins,
      waiveOffDays,
    } = lateComingPolicyResult.data;

    // Create or update policies for each staffId
    const upsertedPolicies = await Promise.all(
      staffIds.map(async (staffId) => {
        // Check if a policy already exists for the given staffId
        const existingPolicy = await prisma.lateComingPolicy.findFirst({
          where: {
            staffId: staffId,
          },
        });

        if (existingPolicy) {
          // Update the existing policy
          return prisma.lateComingPolicy.update({
            where: {
              id: existingPolicy.id, // Use the unique `id` field to identify the record
            },
            data: {
              fineType: fineType,
              gracePeriodMins: gracePeriodMins,
              fineAmountMins: fineAmountMins,
              waiveOffDays: waiveOffDays,
            },
          });
        } else {
          // Create a new policy
          return prisma.lateComingPolicy.create({
            data: {
              staffId: staffId,
              fineType: fineType,
              gracePeriodMins: gracePeriodMins,
              fineAmountMins: fineAmountMins,
              waiveOffDays: waiveOffDays,
            },
          });
        }
      })
    );

    res.status(201).json({
      message: "Late Coming Policies created or updated successfully",
      data: upsertedPolicies,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to create or update Late Coming Policies" });
  }
}

async function createBulkEarlyLeavePolicies(req, res) {
  try {
    const {
      staffIds,
      fineType,
      gracePeriodMins,
      fineAmountMins,
      waiveOffDays,
    } = req.body;

    const validationResult = EarlyLeavePolicySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: validationResult.error.issues[0].message,
      });
    }

    // Iterate over staff IDs and create/update policies
    const upsertedPolicies = await Promise.all(
      staffIds.map(async (staffId) => {
        const existingPolicy = await prisma.earlyLeavePolicy.findFirst({
          where: { staffId },
        });

        if (existingPolicy) {
          // Update the existing policy
          return prisma.earlyLeavePolicy.update({
            where: { id: existingPolicy.id },
            data: {
              fineType,
              gracePeriodMins,
              fineAmountMins,
              waiveOffDays,
            },
          });
        } else {
          // Create a new policy
          return prisma.earlyLeavePolicy.create({
            data: {
              staffId,
              fineType,
              gracePeriodMins,
              fineAmountMins,
              waiveOffDays,
            },
          });
        }
      })
    );

    res.status(201).json({
      message: "Early Leave Policies created or updated successfully",
      data: upsertedPolicies,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to create or update Early Leave Policies" });
  }
}

module.exports = {
  createEarlyLeavePolicy,
  createLateComingPolicy,
  createOvertimePolicy,
  createBulkOvertimePayPolicies,
  createBulkLateComingPolicies,
  createBulkEarlyLeavePolicies,
  getAllEarlyLeavePolicy,
  getAllLateComingPolicy,
  getAllOvertimePolicy,
  updateEarlyLeavePolicyByStaffId,
  updateLateComingPolicyByStaffId,
  updateOvertimePoicyByStaffId,
};
