const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const mediaRepository = require('../repositories/media.repository');
const baseResponse = require('../utils/baseResponse');

// Configure Cloudinary from environment variables
// Format: cloudinary://api_key:api_secret@cloud_name
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (cloudinaryUrl) {
  // Cloudinary automatically configures from the URL
  console.log('Cloudinary configured from environment variable');
} else {
  // Fallback to hardcoded config from .env if parsing fails
  cloudinary.config({
    cloud_name: 'dgbrnqwfe',
    api_key: '675297929318649',
    api_secret: 'WK2khkxX4g67qth5LzAnKHZ34XA'
  });
  console.log('Cloudinary configured with fallback values');
}

// Function to upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    // Check if file exists
    if (!file || !file.path) {
      throw new Error('No file to upload');
    }

    console.log(`Uploading file from path: ${file.path}`);
    const result = await cloudinary.uploader.upload(file.path);
    
    // Delete the temporary file after upload
    try {
      fs.unlinkSync(file.path);
      console.log(`Deleted temporary file: ${file.path}`);
    } catch (unlinkErr) {
      console.warn(`Failed to delete temporary file: ${unlinkErr.message}`);
    }
    
    return result.secure_url;
  } catch (err) {
    console.error(`Cloudinary upload error: ${err.message}`);
    
    // Make sure to clean up temp file even if upload fails
    if (file && file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        console.warn(`Failed to delete temporary file: ${unlinkErr.message}`);
      }
    }
    
    throw new Error(`Image upload failed: ${err.message}`);
  }
};

// Get all media
exports.getAllMedia = async (req, res) => {
  try {
    const media = await mediaRepository.getAllMedia();
    return baseResponse(res, true, 200, "Media retrieved successfully", media);
  } catch (error) {
    console.error("Error retrieving media:", error);
    return baseResponse(res, false, 500, "Error retrieving media", error.message);
  }
};

// Get media by ID
exports.getMediaById = async (req, res) => {
  const id = req.params.id;
  
  try {
    const media = await mediaRepository.getMediaById(id);
    
    if (!media) {
      return baseResponse(res, false, 404, "Media not found", null);
    }
    
    return baseResponse(res, true, 200, "Media retrieved successfully", media);
  } catch (error) {
    console.error("Error retrieving media:", error);
    return baseResponse(res, false, 500, "Error retrieving media", error.message);
  }
};

// Create media
exports.createMedia = async (req, res) => {
  const { title, type, status, rating, review } = req.body;
  const image = req.file;

  // Validate required fields
  if (!title || !type || !status) {
    return baseResponse(res, false, 400, "Title, type, and status are required", null);
  }

  if (type !== 'movie' && type !== 'book') {
    return baseResponse(res, false, 400, "Type must be either 'movie' or 'book'", null);
  }

  if (status !== 'watched' && status !== 'plan' && status !== 'read') {
    return baseResponse(res, false, 400, "Status must be 'watched', 'read', or 'plan'", null);
  }

  if (rating && (rating < 1 || rating > 5)) {
    return baseResponse(res, false, 400, "Rating must be between 1 and 5", null);
  }

  if (!image) {
    return baseResponse(res, false, 400, "Image is required", null);
  }

  try {
    // Upload image to Cloudinary and get the URL
    const imageUrl = await uploadToCloudinary(image);
    
    // Create media record in database
    const media = await mediaRepository.createMedia({
      title,
      type,
      status,
      rating: rating || null,
      review: review || null,
      imageUrl
    });

    return baseResponse(res, true, 201, "Media created successfully", media);
  } catch (error) {
    console.error("Error creating media:", error);
    return baseResponse(res, false, 500, "Error creating media", error.message);
  }
};

// Update media
exports.updateMedia = async (req, res) => {
  const id = req.params.id;
  const { title, type, status, rating, review } = req.body;
  const image = req.file;

  // Validate media type and status if provided
  if (type && type !== 'movie' && type !== 'book') {
    return baseResponse(res, false, 400, "Type must be either 'movie' or 'book'", null);
  }

  if (status && status !== 'watched' && status !== 'plan' && status !== 'read') {
    return baseResponse(res, false, 400, "Status must be 'watched', 'read', or 'plan'", null);
  }

  if (rating && (rating < 1 || rating > 5)) {
    return baseResponse(res, false, 400, "Rating must be between 1 and 5", null);
  }

  try {
    let imageUrl = undefined;
    
    // Only upload new image if one was provided
    if (image) {
      imageUrl = await uploadToCloudinary(image);
    }

    const media = await mediaRepository.updateMedia(id, {
      title,
      type,
      status,
      rating,
      review,
      imageUrl
    });

    return baseResponse(res, true, 200, "Media updated successfully", media);
  } catch (error) {
    if (error.message === "Media not found") {
      return baseResponse(res, false, 404, "Media not found", null);
    }
    console.error("Error updating media:", error);
    return baseResponse(res, false, 500, "Error updating media", error.message);
  }
};

// Delete media
exports.deleteMedia = async (req, res) => {
  const id = req.params.id;

  try {
    const media = await mediaRepository.deleteMedia(id);
    return baseResponse(res, true, 200, "Media deleted successfully", media);
  } catch (error) {
    if (error.message === "Media not found") {
      return baseResponse(res, false, 404, "Media not found", null);
    }
    console.error("Error deleting media:", error);
    return baseResponse(res, false, 500, "Error deleting media", error.message);
  }
};

// Filter media by type
exports.filterMedia = async (req, res) => {
  const type = req.params.type;

  if (type !== 'movie' && type !== 'book') {
    return baseResponse(res, false, 400, "Type must be either 'movie' or 'book'", null);
  }

  try {
    const media = await mediaRepository.filterMedia(type);
    return baseResponse(res, true, 200, `${type}s retrieved successfully`, media);
  } catch (error) {
    console.error(`Error retrieving ${type}s:`, error);
    return baseResponse(res, false, 500, `Error retrieving ${type}s`, error.message);
  }
};