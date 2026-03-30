/**
 * Storage Middleware
 * Configures multer for handling file uploads
 */

import multer from "multer";

// Configure multer for in-memory storage
// Files are stored in memory and passed to the upload handler
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max file size
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Accept any file type - validation happens in the storage service
    cb(null, true);
  },
});

export const singleFileUpload = uploadMiddleware.single("file");
