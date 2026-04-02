// const multer = require("multer");
// const path = require("path");
// const { v4: uuidv4 } = require("uuid");
// const cloudinary = require("cloudinary").v2;
// const fs = require("fs");
// require("dotenv").config();


// // Cloudinary configuration
// cloudinary.config({
//     cloud_name: process.env.CLOUD_NAME,
//     api_key: process.env.CLOUD_API_KEY,
//     api_secret: process.env.CLOUD_API_SECRET,
// });

// // Multer storage configuration
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "./uploads"); // Local storage path
//     },
//     filename: (req, file, cb) => {
//         const uniqueFilename = `${Date.now()}-${uuidv4()}`;
//         req.savedFilename = uniqueFilename; // Save the unique filename in the request
//         cb(null, uniqueFilename);
//     },
// });

// // File filter to allow only specific file types
// const fileFilter = (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
//     if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only .jpeg, .jpg, and .png formats allowed!"), false);
//     }
// };

// // Multer upload configuration
// const upload = multer({
//     storage,
//     limits: { fileSize: 1024 * 1024 * 10 }, // Limit file size to 10MB
//     fileFilter,
// }).single("photoUrl");

// // Middleware to handle Cloudinary upload and dynamic folder structure
// const uploadAndSaveToCloudinary = (req, res, next) => {
//     upload(req, res, async (err) => {
//         if (err) {
//             return res.status(400).send(err.message);
//         }
//         // Define folder name based on route or controller
//         let folderName = "Default_Folder"; // default folder
//         // console.log(req.route.path)
//         if (req.route.path.includes("verify")) {
//             folderName = "Backgound_Verification_Images";
//         } else if (req.route.path.includes("work-entry")) {
//             folderName = "Work_Entry_Images";
//         } else if (req.route.path.includes("project-files")) {
//             folderName = "Work_Entry_Images";
//         }

//         if (req.file) {
//             try {
//                 // Upload to Cloudinary with specified folder
//                 const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
//                     folder: folderName,
//                     public_id: req.savedFilename,
//                 });
//                 console.log(cloudinaryResult);

//                 // Set Cloudinary URL in request for database storage
//                 req.imageUrl = cloudinaryResult.secure_url;
//                 console.log("Uploaded image URL:", req.imageUrl);

//                 // Delete file from local storage after uploading to Cloudinary
//                 fs.unlinkSync(req.file.path);
//             } catch (uploadError) {
//                 return res.status(500).json({ error: "Cloudinary upload failed", details: uploadError });
//             }
//         }

//         next();
//     });
// };

// module.exports = { uploadAndSaveToCloudinary };
