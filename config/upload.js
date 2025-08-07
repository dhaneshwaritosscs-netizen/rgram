const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Local File Upload Configuration for R-GRAM
 * FREE VERSION - Uses local storage instead of cloud services
 */

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');
const avatarsDir = path.join(uploadsDir, 'avatars');

// Create directories if they don't exist
[uploadsDir, imagesDir, videosDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generate unique filename
 * @param {string} originalname - Original filename
 * @returns {string} Unique filename with timestamp
 */
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalname);
  const nameWithoutExt = path.basename(originalname, extension);
  return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
};

/**
 * File filter for images
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file object
 * @param {Function} cb - Callback function
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

/**
 * File filter for videos
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file object
 * @param {Function} cb - Callback function
 */
const videoFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/avi,video/mov,video/wmv').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video type. Only MP4, AVI, MOV, and WMV are allowed.'), false);
  }
};

/**
 * Storage configuration for images
 */
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

/**
 * Storage configuration for videos
 */
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

/**
 * Storage configuration for avatars
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

/**
 * Multer configuration for images
 */
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  }
});

/**
 * Multer configuration for videos
 */
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
  }
});

/**
 * Multer configuration for avatars
 */
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for avatars
  }
});

/**
 * Generate file URL for local storage
 * @param {string} filename - Filename
 * @param {string} type - File type (images, videos, avatars)
 * @param {string} baseUrl - Base URL of the server
 * @returns {string} Complete file URL
 */
const generateFileUrl = (filename, type = 'images', baseUrl = '') => {
  const serverUrl = baseUrl || `http://localhost:${process.env.PORT || 5000}`;
  return `${serverUrl}/uploads/${type}/${filename}`;
};

/**
 * Delete file from local storage
 * @param {string} filepath - Full file path
 * @returns {boolean} Success status
 */
const deleteFile = (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get file size in bytes
 * @param {string} filepath - Full file path
 * @returns {number} File size in bytes
 */
const getFileSize = (filepath) => {
  try {
    const stats = fs.statSync(filepath);
    return stats.size;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

/**
 * Check if file exists
 * @param {string} filepath - Full file path
 * @returns {boolean} File existence
 */
const fileExists = (filepath) => {
  return fs.existsSync(filepath);
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadAvatar,
  generateFileUrl,
  deleteFile,
  getFileSize,
  fileExists,
  uploadsDir,
  imagesDir,
  videosDir,
  avatarsDir,
};
