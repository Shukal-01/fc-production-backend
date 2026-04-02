const { PrismaClient } = require("@prisma/client");
const {
  bankDetailsSchema,
  multipleStaffBankDetailSchema,
} = require("../../../utils/validations");
const prisma = new PrismaClient();

exports.createOrUpdateBankDetails = async (req, res) => {
  const validationResult = bankDetailsSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validationResult.error.issues[0].message,
    });
  }

  const { bank_name, account_number, branch_name, ifsc_code, status, holder_name } =
    validationResult.data;
  const { id } = req.params;

  try {
    const existingBankDetails = await prisma.bankDetails.findUnique({
      where: { staffId: id },
    });

    let responseData;
    if (existingBankDetails) {
      responseData = await prisma.bankDetails.update({
        where: { staffId: id },
        data: {
          holder_name,
          status,
          bank_name,
          account_number,
          branch_name,
          ifsc_code,
        },
      });
      res.status(201).json({
        message: "Bank details updated successfully",
        data: responseData,
      });
    } else {
      responseData = await prisma.bankDetails.create({
        data: {
          holder_name,
          status,
          staffId: id,
          bank_name,
          account_number,
          branch_name,
          ifsc_code,
        },
      });
      res.status(201).json({
        message: "Bank details created successfully",
        data: responseData,
      });
    }
  } catch (error) {
    console.error("Error processing bank details:", error);
    res.status(500).json({ error: "Failed to process bank details" + error.message });
  }
};

exports.getAllBankDetails = async (req, res) => {
  try {
    const bankDetails = await prisma.bankDetails.findMany();
    res.status(200).json(bankDetails);
  } catch (error) {
    // console.log(error);

    res.status(500).json({ error: "Failed to fetch bank details" });
  }
};

exports.getBankDetailsByStaffId = async (req, res) => {
  const { staffId } = req.params;
  // console.log(staffId);

  try {
    const bankDetails = await prisma.bankDetails.findMany({
      where: { staffId },
    });

    if (!bankDetails || bankDetails.length === 0) {
      return res.status(404).json({ error: "Bank details not found" });
    }

    res.status(200).json(bankDetails);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Failed to fetch bank details" });
  }
};

const updateMultipleBankDetailsForStaffs = async (req, res) => {
  const multipleStaffBankAccounts = req.body;

  try {
    // Validate the input using Zod or a similar schema validator
    const validateMultipleStaffBankDetails =
      multipleStaffBankDetailSchema.safeParse(req.body);
    if (!validateMultipleStaffBankDetails.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validateMultipleStaffBankDetails.error.issues[0].message,
      });
    }

    // console.log(multipleStaffBankAccounts);

    // Prepare promises for updating each staff's bank details
    const multipleStaffBankDetailsPromise = multipleStaffBankAccounts.map(
      async ({
        id,
        staffId,
        bank_name,
        account_number,
        account_holder_name,
        branch_name,
        ifsc_code,
      }) => {
        return await prisma.bankDetails.upsert({
          where: { id }, // Unique identifier for the automation rule for specific staff member
          update: {
            staffId: staffId,
            bank_name: bank_name,
            account_number: account_number,
            // account_holder_name: account_holder_name,
            branch_name: branch_name,
            ifsc_code: ifsc_code,
          },
          create: {
            staffId: staffId,
            bank_name: bank_name,
            account_number: account_number,
            // account_holder_name: account_holder_name,
            branch_name: branch_name,
            ifsc_code: ifsc_code,
          },
        });
      }
    );

    // Wait for all updates to complete
    const updatedBankDetails = await Promise.all(
      multipleStaffBankDetailsPromise
    );

    // Send a success response
    res.status(200).json({
      success: true,
      message: "Multiple staff bank details updated successfully.",
      data: updatedBankDetails,
    });
  } catch (error) {
    console.error("Error updating bank details", error);
    res.status(500).json({
      success: false,
      error: "Failed to update bank details: " + error.message,
    });
  }
};

exports.updateBankDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    const data = await updateMultipleBankDetailsForStaffs(req, res);
    return data;
  } else {
    const validationResult = bankDetailsSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.issues[0].message,
      });
    }

    const { bank_name, account_number, branch_name, ifsc_code } =
      validationResult.data;

    try {
      const updatedBankDetails = await prisma.bankDetails.update({
        where: { id },
        data: { bank_name, account_number, branch_name, ifsc_code },
      });
      res.status(200).json(updatedBankDetails);
    } catch (error) {
      // console.log(error);
      res.status(500).json({ error: "Failed to update bank details" });
    }
  }
};

// Delete bank details by ID
exports.deleteBankDetails = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.bankDetails.delete({
      where: { id },
    });
    res.status(200).json({ message: "Bank details deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bank details" });
  }
};
