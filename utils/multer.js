const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const express = require("express");
const multer = require("multer");
require("dotenv").config(); // Load environment variables

const app = express();

// Set up Cloudinary configuration using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true, // Optional, but recommended for secure uploads
});

// Set up the Cloudinary storage with Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "some-folder-name", // Set the folder name in Cloudinary
    format: async (req, file) => {
      // Set the format of the file to be 'image' or any specific image type
      const imageFormats = ["jpeg", "png", "webp", "gif", "jpg"];

      // You can choose to return the format based on the file type or your needs
      const ext = file.mimetype.split("/")[1]; // Extract the extension (e.g., jpeg, png)
      if (imageFormats.includes(ext)) {
        return ext; // Return the appropriate image format based on file type
      }
      return "png"; // Default to 'png' if not a valid image type
    },
    public_id: (req, file) => {
      // You can compute the public ID based on the request or file name
      return `user-uploads/${file.originalname}`;
    },
  },
});

// Set up Multer to use Cloudinary storage
const parser = multer({ storage: storage });

module.exports = { parser };
