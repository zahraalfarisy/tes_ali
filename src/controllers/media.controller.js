const AWS = require('aws-sdk');
const mediaRepository = require('../repositories/media.repository');
const baseResponse = require('../utils/baseResponse');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Function to upload file to AWS S3
const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
    Key: `uploads/${file.originalname}`, // Key for the file in the S3 bucket
    Body: file.buffer, // The file content
    ContentType: file.mimetype,
    ACL: 'public-read', // Make the file public or private as needed
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // Return the file URL
  } catch (err) {
    throw new Error('Error uploading to S3: ' + err.message);
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
    // Upload image to S3 and get the URL
    const imageUrl = await uploadToS3(image);
    
    // Create media record in the repository
    const media = await mediaRepository.createMedia({
      title,
      type,
      status,
      rating: rating || null,
      review: review || null,
      imageUrl, // Save the URL of the uploaded image
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
    const media = await mediaRepository.updateMedia(id, {
      title,
      type,
      status,
      rating,
      review,
    }, image);

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
