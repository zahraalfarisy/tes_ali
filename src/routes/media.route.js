const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mediaController = require('../controllers/media.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all media
router.get('/media/', mediaController.getAllMedia);

// Get media by id
router.get('/media/:id', mediaController.getMediaById);

// Filter media by type (movie or book)
router.get('/media/filter/:type', mediaController.filterMedia);

// Create new media
router.post('/media/', upload.single('image'), mediaController.createMedia);

// Update media
router.put('/media/:id', upload.single('image'), mediaController.updateMedia);

// Delete media
router.delete('/media/:id', mediaController.deleteMedia);

module.exports = router;