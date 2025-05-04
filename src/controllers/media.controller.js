const mediaRepository = require('../repositories/media.repository');
const baseResponse = require('../utils/baseResponse');

exports.getAllMedia = async (req, res) => {
  try {
    const media = await mediaRepository.getAllMedia();
    return baseResponse(res, true, 200, "Media retrieved successfully", media);
  } catch (error) {
    console.error("Error retrieving media:", error);
    return baseResponse(res, false, 500, "Error retrieving media", error.message);
  }
};

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

exports.createMedia = async (req, res) => {
  const { title, type, status, rating, review } = req.body;
  const image = req.file;
  
  // Validasi input
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

  // Pastikan folder uploads ada
  const fs = require('fs');
  const path = require('path');
  const uploadDir = path.join(__dirname, '..', 'uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const media = await mediaRepository.createMedia({
      title,
      type,
      status,
      rating: rating || null,
      review: review || null
    }, image);

    return baseResponse(res, true, 201, "Media created successfully", media);
  } catch (error) {
    console.error("Error creating media:", error);
    return baseResponse(res, false, 500, "Error creating media", error.message);
  }
};
