const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { customFieldSchema } = require("../../../utils/validations");

const customFieldDetails = async (req, res) => {
  try {
    const validation = customFieldSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error.issues[0].message,
      });
    }
    const { staffId, field_name, field_value } = validation.data;

    const newCustomDetails = await prisma.customDetails.create({
      data: {
        staffId,
        field_name,
        field_value,
      },
    });
    res.status(201).json({
      message: "Custom field created successfully",
      data: newCustomDetails,
    });
  } catch (error) {
    console.error("Error processing custom field:", error);
    res.status(500).json({
      message: "Failed to process custom details!" + error.message,
    });
  }
};

// Get All Custom Fields
const getAllCustomFields = async (req, res) => {
  try {
    const customDetails = await prisma.customDetails.findMany({});
    res.status(200).json(customDetails);
  } catch (error) {
    // console.log(error);
    res.status(500).json({
      error: "Failed to fetch custom details" + error.message,
    });
  }
};

// update custom fields by id
const updateCustomFields = async (req, res) => {
  const { id } = req.params;
  const validation = customFieldSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues[0].message,
    });
  }
  const { staffId, field_name, field_value } = validation.data;

  try {
    const update = await prisma.customDetails.update({
      where: { id },
      data: {
        staffId,
        field_name,
        field_value,
      },
    });
    return res
      .status(200)
      .json({ message: "custom fields Successfully Updated!", update });
  } catch (error) {
    // console.log(error);
    return res
      .status(500)
      .json({ message: "Custome field updated failed" + error.message });
  }
};

// Get Custom Fields By ID

const getCustomFieldById = async (req, res) => {
  const { id } = req.params;
  try {
    const newCustomFieldsId = await prisma.customDetails.findUnique({
      where: { id },
    });
    if (newCustomFieldsId) {
      return res.status(200).json({ status: 200, data: newCustomFieldsId });
    } else {
      return res.status(400).json({
        message: "custom fields not found" + error.message,
      });
    }
  } catch (error) {
    // console.log(error);
    return res
      .status(500)
      .json({ message: "failed get custom fields data!" + error.message });
  }
};

// Delete custom fields by id

const deleteCustomFields = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteCustomFields = await prisma.customDetails.delete({
      where: { id },
    });
    if (deleteCustomFields) {
      return res.status(200).json({
        status: 200,
        message: "delete custom fields this id ",
      });
    } else {
      return res
        .status(400)
        .json({ message: "not found this custom fiels id" });
    }
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      status: 500,
      message: "failed to delete custom fields id!" + error.message,
    });
  }
};

module.exports = {
  customFieldDetails,
  getAllCustomFields,
  getCustomFieldById,
  deleteCustomFields,
  updateCustomFields,
};
