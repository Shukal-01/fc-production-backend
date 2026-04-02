const z = require("zod");

const idSchema = z.string().uuid("Invalid UUID format");
const clientNotesSchema = z.object({
  title: z.string().min(1, "Title is required"), // Required string for title
  description: z.string().min(1, "Description is required"), // Optional string for description
  color: z.string("").min(1, "Color is required"), // Hex color validation
});

const pastEmploymentSchema = z.object({
  id: z.string().optional(), // UUID is generated, so it can be optional
  company_name: z.string().min(1, "Company name is required."),
  designation: z.string().optional(),
  joining_date: z.preprocess(
    (val) => (val ? new Date(val) : new Date()),
    z.date()
  ),
  leaving_date: z.preprocess(
    (val) => (val ? new Date(val) : new Date()),
    z.date()
  ),
  currency: z.string().optional(),
  salary: z
    .number(
      {
        invalid_type_error: "Salary must be a number",
      },
      {
        required_error: "Salary is required",
      }
    )
    .optional(),
  company_gst: z.string().optional(),
  staffId: z.string().optional(), // UUID format is optional if not linked initially
  createdAt: z
    .preprocess((val) => (val ? new Date(val) : new Date()), z.date())
    .optional(),
  updatedAt: z
    .preprocess((val) => (val ? new Date(val) : new Date()), z.date())
    .optional(),
});

const allPermissionSchema = z.object({
  clients_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  projects_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  report_permissions: z
    .object({
      view_global: z.boolean().default(false).optional(),
      view_time_sheets: z.boolean().default(false).optional(),
    })
    .optional(),
  staff_role_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  settings_permissions: z
    .object({
      view_global: z.boolean().default(false).optional(),
      view_time_sheets: z.boolean().default(false).optional(),
    })
    .optional(),
  staff_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  task_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  sub_task_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  chat_module_permissions: z
    .object({
      grant_access: z.boolean().default(false).optional(),
    })
    .optional(),
  ai_permissions: z
    .object({
      grant_access: z.boolean().default(false).optional(),
    })
    .optional(),
});

const roleNameSchema = z
  .string()
  .regex(/^[a-zA-Z\s]+$/, "Role name can only contain alphabets and spaces");

const newRoleSchema = z.object({
  roleName: roleNameSchema.min(2, "role name is required"),
  permissions: allPermissionSchema.optional(),
});

const updateRoleSchema = z.object({
  role_name: roleNameSchema.optional(),
  permissions: allPermissionSchema.optional(),
});

const staffIds = z.array(z.string().uuid()).min(1, "staff ids are required");

const customFieldSchema = z.object({
  staffId: z.string().uuid("Invalid staff ID"),
  field_name: z.string().min(1, "Field name is required"),
  field_value: z.string().min(1, "Field value is required"),
});

const attendenceAutomationRuleSchema = z.object({
  auto_absent: z.boolean().optional(),
  present_on_punch: z.boolean().optional(),
  auto_half_day: z.string().optional(),
  mandatory_half_day: z.string().optional(),
  mandatory_full_day: z.string().optional(),
});

const attendanceModeSchema = z.object({
  selfie_attendance: z.boolean().default(false),
  qr_attendance: z.boolean().default(false),
  gps_attendance: z.boolean().default(false),
  mark_attendance: z.enum(["Office", "Anywhere"]).default("Office"),
  allow_punch_in_for_mobile: z.boolean().default(false),
});

const multipleStaffBankDetailSchema = z.array(
  z.object({
    id: z.string().min(1, "ID is required").uuid("Invalid ID"),
    staffId: z.string().min(1, "Staff ID is required").uuid("Invalid staff ID"),
    bank_name: z.string().min(1, "Bank name is required"),
    account_number: z
      .string()
      .min(1, "Account number is required")
      .length(12, "Account number must be exactly 12 digits") // Assuming a fixed length based on provided data
      .regex(/^\d{12}$/, "Account number should only contain digits"),
    account_holder_name: z
      .string()
      .min(3, "Account holder name must be at least 3 characters"),
    branch_name: z
      .string()
      .min(3, "Branch name should have at least 3 characters")
      .max(60, "Branch name should have at most 60 characters"),
    ifsc_code: z
      .string()
      .min(1, "IFSC code is required")
      .regex(
        /^[A-Z]{4}0[A-Z0-9]{6}$/,
        "Invalid IFSC code. Example: ABCD0123456"
      )
      .length(11, "IFSC code must be exactly 11 characters"),
  })
);

const aadhaarNumberPattern = /^\d{4}-\d{4}-\d{4}$/; // Format: 1234-5678-9012
const panNumberPattern = /^[A-Z]{5}\d{4}[A-Z]$/; // Format: ABCDE1234F
const uanNumberPattern = /^\d{12}$/; // 12 digits
const drivingLicensePattern = /^[A-Z]{2}[0-9]{2}[0-9]{1,11}$/;
const voterIdPattern = /^[A-Z]{3}[0-9]{7}$/;

const staffBackgroundVerificationSchema = z.object({
  aadhaar_number: z
    .string()
    // .regex(aadhaarNumberPattern, "invalid Aadhaar number format. Ex 1234-5678-9012")
    .optional(),
  aadhaar_verification_status: z.string().default("Not Verified").optional(),
  aadhaar_file: z.string().optional().nullable(),
  voter_id_number: z
    .string()
    // .regex(voterIdPattern, "invalid voter id number format Like ABCD1234567")
    .optional(),
  voter_id_verification_status: z.string().default("Not Verified").optional(),
  voter_id_file: z.string().optional().nullable(),
  pan_number: z
    .string()
    // .regex(panNumberPattern, "invalid pan number format. Like ABCDE1234F")
    .optional(),
  pan_verification_status: z.string().default("Not Verified").optional(),
  pan_file: z.string().optional().nullable(),
  uan_number: z
    .string()
    // .regex(uanNumberPattern, "Invalid uan number format. Like 123456789012")
    .optional(),
  uan_verification_status: z.string().default("Not Verified").optional(),
  uan_file: z.string().optional().nullable(),
  driving_license_number: z
    .string()
    // .regex(drivingLicensePattern, "Invalid driving license number format. Like AB123456789")
    .optional(),
  driving_license_status: z.string().default("Not Verified").optional(),
  driving_license_file: z.string().optional().nullable(),
  face_file: z.string().optional().nullable(),
  face_verification_status: z.string().default("Not Verified").optional(),
  current_address: z.string().optional(),
  permanent_address: z.string().optional(),
  address_status: z.string().default("Not Verified").optional(),
  address_file: z.string().optional().nullable(),
  staffId: z.string().optional(),
});

const clientSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  vat_number: z
    .string()
    .regex(
      /^[A-Z0-9]{8,12}$/,
      "VAT number must be 8-12 characters long, containing only uppercase letters and digits, VAT number should be unique."
    ),
  phone: z
    .string()
    .regex(
      /^\+?\d{7,15}$/,
      "Phone number must be 7 to 15 digits, with an optional '+' prefix"
    ),
  website: z.string(),
  groups: z.array(z.string()).min(1, "At least one group is required"),
  currency: z.array(z.string()).min(1, "At least one group is required"),
  default_language: z
    .array(z.string())
    .min(1, "At least one group is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(2, "Country name is required"),
  state: z.string().min(2, "State name is required"),
  city: z.string().min(1, "City name is required"),
  status: z.boolean().default(false),
  zip_code: z.string().regex(/^\d{4,10}$/, "ZIP code must be 4 to 10 digits"),
});

const staffSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }),
  mobile: z
    .string()
    .min(10, "Mobile number should be at least 10 digits")
    .optional(),
  official_email: z.string().email("Invalid email format").optional(),
  date_of_birth: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid date format for date_of_birth",
    }),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  blood_group: z.string().optional(),
  job_title: z.string().optional(),
  departmentId: z.string().optional(),
  branchId: z.string().optional(),
  roleId: z.string().optional(),
  login_otp: z.string().optional(),
  guardian_name: z.string().optional(),
  date_of_joining: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid date format for date_of_joining",
    }),
  current_address: z.string().optional(),
  permanent_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_mobile: z
    .string()
    .min(10, "Emergency contact number should be at least 10 digits")
    .optional(),
  emergency_contact_relation: z.string().optional(),
  emergency_contact_address: z.string().optional(),
  adminId: z.string().optional(),
});

const bankDetailsSchema = z.object({
  holder_name: z.string().min(1, "Account holder name is required"),
  status: z.string().optional(),
  bank_name: z.string().min(1, "Bank name is required"),
  account_number: z
    .string()
    .min(1, "Account number is required")
    .regex(/^[0-9]+$/, "Account number must be numeric"),
  branch_name: z.string().min(1, "Branch name is required"),
  ifsc_code: z
    .string()
    .min(1, "IFSC code is required")
    .regex(/^[A-Za-z]{4}\d{7}$/, "Invalid IFSC code. Example: ABCD0123456"),
});

const bulkLeavePolicySchema = z.object({
  name: z.string().min(1, "Name is required"),
  allowed_leaves: z
    .number()
    .min(0, "Allowed leaves must be a non-negative number"),
  carry_forward_leaves: z
    .number()
    .min(0, "Carry forward leaves must be a non-negative number"),
  policy_type: z
    .string()
    .refine(
      (type) => type === "YEARLY" || type === "MONTHLY",
      "Policy type must be either 'YEARLY' or 'MONTHLY'"
    )
    .default("MONTHLY"),
});

const leavePolicySchema = z.object({
  staffId: z.string().uuid("Invalid Staff ID").optional(),
  name: z.string().min(1, "Name is required"),
  allowed_leaves: z.number().min(0).default(0),
  carry_forward_leaves: z.number().min(0).default(0),
  policy_type: z
    .string()
    .refine(
      (type) => type === "YEARLY" || type === "MONTHLY",
      "Policy type must be either 'YEARLY' or 'MONTHLY'"
    )
    .default("MONTHLY"),
});

const leaveBalanceSchema = z.object({
  staffId: z.string().uuid("Invalid Staff ID"),
  leaveTypeId: z.string().uuid("Invalid Leave Type ID"),
  balance: z.number().default(0),
  used: z.number().default(0),
});

const leaveRequestSchema = z.object({
  staffId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  request_date: z.coerce.date().optional().default(new Date()),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  status: z.string().min(1, "Status is required"),
});

const createLeaveBalanceSchema = leaveBalanceSchema
  .omit({ leaveTypeId: true })
  .partial();

const updateLeaveBalanceSchema = leaveBalanceSchema.partial();

const createLeaveRequestSchema = leaveRequestSchema
  .omit({ staffId: true })
  .partial();

const updateLeaveRequestSchema = z.object({
  status: z.string().optional(),
});

const EarlyLeavePolicySchema = z.object({
  staffId: z.string().uuid({ message: "Staff ID must be a valid UUID." }),
  fineType: z.string().refine((value) => ["HOURLY", "DAILY"].includes(value), {
    message: "Fine Type must be either 'HOURLY' or 'DAILY'.",
  }),
  gracePeriodMins: z
    .number()
    .nonnegative({ message: "Grace Period cannot be negative." }),
  fineAmountMins: z
    .number()
    .nonnegative({ message: "Fine Amount cannot be negative." }),
  waiveOffDays: z
    .number()
    .nonnegative({ message: "Waive Off Days cannot be negative." }),
});

const LateComingPolicySchema = z.array(
  z.object({
    fineType: z
      .string()
      .refine((value) => ["HOURLY", "DAILY"].includes(value), {
        message: "Fine Type must be either 'HOURLY' or 'DAILY'.",
      })
      .optional(),
    gracePeriodMins: z
      .number({ required_error: "Grace Period is required." })
      .optional(),
    fineAmountMins: z
      .number({ required_error: "Fine Amount is required." })
      .optional(),
    waiveOffDays: z
      .number({ required_error: "Waive Off Days is required." })
      .optional(),
    staffId: z
      .string({ required_error: "Staff ID is required." })
      .uuid("Invalid Staff ID format"),
  })
);

const OvertimePolicySchema = z.object({
  staffId: z
    .string({ required_error: "Staff ID is required." }) // Ensure staffId is provided
    .uuid({ message: "Invalid Staff ID format" }), // Validate UUID format

  gracePeriodMins: z
    .number()
    .nonnegative({ message: "Grace Period must be a non-negative number." }) // Allow float values and ensure non-negative
    .optional(), // Make this field optional

  extraHoursPay: z
    .number()
    .nonnegative({ message: "Extra Hours Pay must be a non-negative number." }) // Allow float values and ensure non-negative
    .optional(), // Make this field optional

  publicHolidayPay: z
    .number()
    .nonnegative({
      message: "Public Holiday Pay must be a non-negative number.",
    }) // Allow float values and ensure non-negative
    .optional(), // Make this field optional

  weekOffPay: z
    .number()
    .nonnegative({ message: "Week Off Pay must be a non-negative number." }) // Allow float values and ensure non-negative
    .optional(), // Make this field optional
});

const weekOffShiftSchema = z.object({
  weekOne: z.boolean().optional().default(false),
  weekTwo: z.boolean().optional().default(false),
  weekThree: z.boolean().optional().default(false),
  weekFour: z.boolean().optional().default(false),
  weekFive: z.boolean().optional().default(false),
});

const MultipleFlexibleShiftSchema = z.object({
  dateTime: z.date(),
  weekOff: z.boolean().default(false), // Set default value to false
  staffId: z.array(z.string()).min(1, { message: "Staff ID is required." }),
  shifts: z.array(z.string()).optional(),
});

const FlexibleShiftSchema = z.object({
  dateTime: z.date(),
  weekOff: z.boolean().default(false), // Set default value to false
  staffId: z.string().uuid(1, { message: "Staff ID is required." }),
  shifts: z.array(z.string()).optional(),
});

const MultipleFixedShiftSchema = z.object({
  day: z
    .string()
    .refine(
      (value) =>
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(value),
      {
        message:
          "Day Type must be either 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'.",
      }
    ),
  weekOff: z.boolean().default(false), // Set default value to false
  staffId: z.array(z.string()).min(1, { message: "Staff ID is required." }),
  shifts: z.array(z.string()).optional(),
  weekId: z.string().optional(),
});

const FixedShiftSchema = z.object({
  day: z
    .string()
    .refine(
      (value) =>
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(value),
      {
        message:
          "Day Type must be either 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'.",
      }
    ),
  weekOff: z.boolean().default(false), // Set default value to false
  staffId: z.string().uuid(1, { message: "Staff ID is required." }),
  shifts: z.array(z.string()).optional(),
  weekId: z.string().optional(),
});

const ShiftSchema = z.object({
  shiftName: z.string().min(1, "Shift name is required"),
  shiftStartTime: z.string(),
  shiftEndTime: z.string(),
  punchInType: z
    .string()
    .refine((value) => ["ANYTIME", "ADDLIMIT"].includes(value), {
      message: "PunchIn Type must be either 'ANYTIME' or 'ADDLIMIT'.",
    })
    .optional(),
  punchOutType: z
    .string()
    .refine((value) => ["ANYTIME", "ADDLIMIT"].includes(value), {
      message: "PunchOut Type must be either 'ANYTIME' or 'ADDLIMIT'.",
    })
    .optional(),
  allowPunchInHours: z.number().optional(),
  allowPunchInMinutes: z.number().optional(),
  allowPunchOutHours: z.number().optional(),
  allowPunchOutMinutes: z.number().optional(),
});

const PunchInSchema = z.object({
  punchInMethod: z
    .string()
    .refine((value) => ["BIOMETRIC", "QRSCAN", "PHOTOCLICK"].includes(value), {
      message:
        "PunchInType Type must be either 'BIOMETRIC', 'QRSCAN' Or 'PHOTOCLICK'.",
    })
    .optional(),
  biometricData: z.string().optional(), // Only required for biometric
  qrCodeValue: z.string().optional(), // Only required for QR scan
  photoUrl: z.string().optional(), // Required for photo click
  location: z.string().min(1, { message: "Location is required." }),
  fine: z.string().optional(),
});

const PunchOutSchema = z.object({
  punchOutMethod: z
    .string()
    .refine((value) => ["BIOMETRIC", "QRSCAN", "PHOTOCLICK"].includes(value), {
      message:
        "PunchInType Type must be either 'BIOMETRIC', 'QRSCAN' Or 'PHOTOCLICK'.",
    })
    .optional(),
  biometricData: z.string().optional(), // Only required for biometric
  qrCodeValue: z.string().optional(), // Only required for QR scan
  photoUrl: z.string().optional(), // Required for photo click
  location: z.string().min(1, { message: "Location is required." }),
  overtime: z.string().optional(),
  // staffId: z.string().min(1, { message: "Staff ID is required." }),
});

const PunchRecordsSchema = z.object({
  punchInId: z.string().min(1, { message: "PunchInId is required." }),
  punchOutId: z.string().min(1, { message: "PunchOutId is required." }),
  staffId: z.string().min(1, { message: "StaffId is required." }),
});

const StartBreakSchema = z.object({
  breakMethod: z
    .string()
    .refine((value) => ["BIOMETRIC", "QRSCAN", "PHOTOCLICK"].includes(value), {
      message:
        "Break Method Type must be either 'BIOMETRIC', 'QRSCAN' Or 'PHOTOCLICK'.",
    })
    .optional(),
  biometricData: z.string().optional(), // Only required for biometric
  qrCodeValue: z.string().optional(), // Only required for QR scan
  photoUrl: z.string().optional(), // Required for photo click
  location: z.string().min(1, { message: "Location is required." }),
});

const EndBreakSchema = z.object({
  breakMethod: z
    .string()
    .refine((value) => ["BIOMETRIC", "QRSCAN", "PHOTOCLICK"].includes(value), {
      message:
        "Break Method Type must be either 'BIOMETRIC', 'QRSCAN' Or 'PHOTOCLICK'.",
    })
    .optional(),
  biometricData: z.string().optional(), // Only required for biometric
  qrCodeValue: z.string().optional(), // Only required for QR scan
  photoUrl: z.string().optional(), // Required for photo click
  location: z.string().min(1, { message: "Location is required." }),
});

const TaskStatusSchema = z.object({
  taskStatusName: z.string().min(1, "Task Status name is required"),
  statusColor: z.string().optional(),
  statusOrder: z.number().min(1, "Status Order is required"),
  isHiddenFor: z
    .array(z.string())
    .default([])
    .optional(), // Define as an array of numbers
  canBeChangedId: z.array(z.string()).default([]).optional(),
});

const TaskPrioritySchema = z.object({
  taskPriorityName: z.string().min(1, "Task Priority name is required"),
});

const TaskDetailSchema = z.object({
  taskName: z
    .string()
    .min(1, { message: "Task name is required" })
    .max(255, { message: "Task name must not exceed 255 characters" }),
  taskStatusId: z.string().uuid({ message: "Invalid task status ID" }),
  taskPriorityId: z.string().uuid({ message: "Invalid task priority ID" }),
  startDate: z.string(),
  endDate: z.string().optional(),
  dueDate: z.string().optional(),
  projectId: z.string().uuid({ message: "Invalid project ID" }).optional(),
  departmentId: z
    .string()
    .uuid({ message: "Invalid department ID" })
    .optional(),
  taskAssignee: z
    .array(z.string().uuid({ message: "Invalid assignee ID" }))
    .min(1, { message: "At least one task assignee is required" }),
  taskDescription: z.string().optional(),
  taskTag: z
    .array(z.string().min(1, { message: "Tag cannot be empty" }))
    .default([]),
  attachFile: z
    .array(z.string().url({ message: "Invalid file URL" }))
    .default([]),
  // adminId: z
  // .string()
  // .uuid({ message: "Invalid admin ID" }),
});

const ticketInformationSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }),
  contact: z
    .string()
    .min(10, "Mobile number should be at least 10 digits")
    .optional(),

  email: z.string().email("Invalid email format").optional(),
});

// Admin Register

const adminSchema = z.object({
  first_name: z.string().min(1, "First Name is required"),

  last_name: z.string().min(1, "Last Name is required"),

  mobile: z
    .string()
    .length(10, "Mobile number must be exactly 10 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits")
    .optional(),

  email: z.string().email("Invalid email format").optional(),
});

const projectStatusSchema = z.object({
  project_name: z.string().min(1, "Project Name is required"),
  project_color: z.string().min(1, "Project Color is required"),
  project_order: z.number().min(1, "Project Order is required"),
  default_filter: z.boolean().default(false).optional(), // Optional field
  can_changed: z.array(z.string()).default([]).optional(),
});

const projectSchema = z.object({
  staffId: z.array(z.string().uuid()),
  project_name: z.string().min(1, "Project name is required"),
  customerId: z.string().uuid().optional(),
  billing_type: z.string().min(1, "Billing type is required"),
  status: z.string().uuid(),
  priority: z.string().uuid(),
  total_rate: z
    .string()
    .regex(/^\d+$/, "Total rate must be a valid number")
    .transform(Number),
  start_date: z.string().min(1, "Start date is required"),
  deadline: z.string().min(1, "Deadline is required"),
  description: z.string().optional(),
  tags: z.array(z.string()),
  estimated_hours: z
    .string()
    .regex(/^\d+$/, "Estimated hours must be a valid number")
    .transform(Number),
  send_mail: z.boolean(),
});

// project Priority Schema
const projectPrioritySchema = z.object({
  Priority_name: z.string().min(1, "Priority Name is required"),
  Priority_color: z.string().min(1, "Priority Color is required"),
  Priority_order: z.number().min(1, "Priority Order is required"),
  default_filter: z.boolean().optional(),
  is_hidden: z
    .array(z.string())
    .min(1, "Select at least one option for Is Hidden"),
  can_changed: z.array(z.string()).default([]).optional(),
});

const discussionsSchema = z.object({
  subject: z.string().min(1, "Subject is required"), // Ensures it's a non-empty string
  discription: z.string().min(1, "Description is required"), // Ensures it's a non-empty string
  last_activity: z.string().min(1, "Last activity is required"), // Ensures it's a non-empty string
  total_comments: z
    .string()
    .min(1, "Total comments must be a string representing a number"), // Ensures it is a numeric string
  visible_to_customer: z.string().min(1, "Visible to customer is required"), // Ensures it's a non-empty string
});
const projectFilesSchema = z.object({
  last_activity: z.string().min(1, "Last activity is required"), // Ensures it's a non-empty string
  total_comments: z
    .string()
    .min(1, "Total comments must be a string representing a number"), // Ensures it is a numeric string
  visible_to_customer: z.boolean().default(false), // Ensures it's a non-empty string
  uploaded_by: z.string().min(1, "Uploaded by is required"), // Ensures it's a non-empty string
});

const salaryDetailsSchema = z.object({
  effective_date: z.coerce.date().refine((date) => !isNaN(date.getTime()), {
    message: "Effective date is required",
  }),
  salary_type: z
    .string()
    .optional()
    .refine((type) => type === null || type.trim() !== "", {
      message: "Salary type is a required field",
    }),
  ctc_amount: z.number().optional(),
  employer_pf: z.number().optional(),
  employer_esi: z.number().optional(),
  employer_lwf: z.number().optional(),
  employee_pf: z.number().optional(),
  employee_esi: z.number().optional(),
  professional_tax: z.number().optional(),
  employee_lwf: z.number().optional(),
  tds: z.number().optional(),
  staffId: z.string().uuid(),
});
// Deductions Schema
const deductionsEarningsSchema = z.object({
  staffId: z.string().uuid("Invalid Staff ID format").optional(),
  heads: z.string().min(1, "Head Name is required").optional(),
  amount: z.number().optional(),
  calculation: z.string().min(1, "Calculation is required").optional(),
  deduction_month: z.string().optional(),
  salary_month: z.string().optional(),
});

const workEntrySchema = z.object({
  work_name: z.string().min(1, "Work Name is required"),
  units: z.string().min(1, "Units is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().optional(),
  attachments: z.string().optional(),
  staffDetailsId: z.string().uuid("Staff ID is required"),
});

const DepartmentSchema = z.object({
  departmentName: z.string().min(1, "Department Name is required"),
  permissions: allPermissionSchema.optional(),
});

const BranchSchema = z.object({
  branchName: z.string().min(1, "Branch Name is required"),
});

const FineSchema = z
  .object({
    staffId: z.string().uuid("Invalid staff ID"), // UUID format check
    lateEntryFineAmount: z
      .number({ invalid_type_error: "Late Entry Fine Amount must be a number" })
      .min(1, "Late Entry Fine Amount is required"),
    lateEntryAmount: z
      .number({ invalid_type_error: "Late Entry Amount must be a number" })
      .min(0, "Late Entry Amount must be a positive number"),
    excessBreakFineAmount: z
      .number({
        invalid_type_error: "Excess Break Fine Amount must be a number",
      })
      .optional(),
    excessBreakAmount: z
      .number({ invalid_type_error: "Excess Break Amount must be a number" })
      .min(0, "Excess Break Amount must be a positive number")
      .optional(),
    earlyOutFineAmount: z
      .number({ invalid_type_error: "Early Out Fine Amount must be a number" })
      .optional(),
    earlyOutAmount: z
      .number({ invalid_type_error: "Early Out Amount must be a number" })
      .min(0, "Early Out Amount must be a positive number")
      .optional(),
    totalAmount: z
      .number({ invalid_type_error: "Total Amount must be a number" })
      .min(0, "Total Amount must be a positive number"),
    shiftIds: z.string().optional(), // Array of strings for shift IDs
  })
  .strict(); // Ensures no extra fields are allowed

const OverTimeSchema = z.object({
  earlyCommingEntryAmount: z
    .number({
      invalid_type_error: "Early Comming Entry Amount must be a number",
    })
    .default(1)
    .optional(),
  earlyEntryAmount: z
    .number({ invalid_type_error: "Early Entry Amount must be a number" })
    .default(0)
    .optional(),
  lateOutOvertimeAmount: z
    .number({ invalid_type_error: "Late Out Overtime Amount must be a number" })
    .default(1)
    .optional(),
  lateOutAmount: z
    .number({ invalid_type_error: "Late Out Amount must be a number" })
    .default(0)
    .optional(),
  totalAmount: z
    .number({ invalid_type_error: "Total Amount must be a number" })
    .default(0)
    .optional(),
  shiftIds: z.string().nullable().optional(),
  staffId: z.string().nullable().optional(),
});

const leadValidationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  website: z.string().url("Invalid URL").optional(),
  phone: z
    .string()
    .min(10, "Phone number should be at least 10 digits")
    .optional(),
  leadValue: z.array(z.number()).optional().default([]), // Float array
  currencySymbol: z.array(z.string()).optional().default([]), // String array
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  defaultLanguage: z.array(z.string()).optional().default([]), // String array
  company: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  created_at: z.date().default(new Date()),
  updated_at: z.date().default(new Date()),
  tags: z.array(z.string()).optional().default([]),
});

// comment validations
const commentSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  message: z.string().optional(),
  files: z.array(z.string()).optional(),
});

module.exports = {
  clientSchema,
  idSchema,
  newRoleSchema,
  updateRoleSchema,
  attendenceAutomationRuleSchema,
  attendanceModeSchema,
  multipleStaffBankDetailSchema,
  staffBackgroundVerificationSchema,
  roleNameSchema,
  bankDetailsSchema,
  staffSchema,
  leavePolicySchema,
  createLeaveBalanceSchema,
  updateLeaveBalanceSchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  EarlyLeavePolicySchema,
  LateComingPolicySchema,
  OvertimePolicySchema,
  FlexibleShiftSchema,
  FixedShiftSchema,
  ShiftSchema,
  PunchInSchema,
  PunchOutSchema,
  PunchRecordsSchema,
  TaskStatusSchema,
  TaskPrioritySchema,
  TaskDetailSchema,
  ticketInformationSchema,
  adminSchema,
  EndBreakSchema,
  StartBreakSchema,
  projectStatusSchema,
  projectPrioritySchema,
  salaryDetailsSchema,
  deductionsEarningsSchema,
  projectSchema,
  pastEmploymentSchema,
  workEntrySchema,
  weekOffShiftSchema,
  bulkLeavePolicySchema,
  DepartmentSchema,
  FineSchema,
  MultipleFixedShiftSchema,
  MultipleFlexibleShiftSchema,
  BranchSchema,
  clientNotesSchema,
  customFieldSchema,
  discussionsSchema,
  projectFilesSchema,
  OverTimeSchema,
  leadValidationSchema,
  commentSchema,
};
