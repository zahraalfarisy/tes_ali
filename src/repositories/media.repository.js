const { query } = require("../database/pgDatabase");
const fs = require('fs');

exports.getAllMedia = async () => {
  const result = await query("SELECT * FROM media ORDER BY created_at DESC");
  return result.rows;
};

exports.getMediaById = async (id) => {
  const result = await query("SELECT * FROM media WHERE id = $1", [id]);
  return result.rows[0];
};

exports.createMedia = async (mediaData) => {
  const { title, type, status, rating, review, imageUrl } = mediaData;

  const result = await query(
    "INSERT INTO media (title, type, status, image_url, rating, review) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [title, type, status, imageUrl, rating, review]
  );

  return result.rows[0];
};

exports.updateMedia = async (id, mediaData) => {
  const existingMedia = await exports.getMediaById(id);
  if (!existingMedia) throw new Error("Media not found");

  const { title, type, status, rating, review, imageUrl } = mediaData;
  
  // If we have a new image URL, use it; otherwise keep the existing one
  const newImageUrl = imageUrl || existingMedia.image_url;

  const result = await query(
    `UPDATE media 
     SET title = COALESCE($1, title), 
         type = COALESCE($2, type), 
         status = COALESCE($3, status), 
         image_url = $4, 
         rating = COALESCE($5, rating), 
         review = COALESCE($6, review) 
     WHERE id = $7 RETURNING *`,
    [title, type, status, newImageUrl, rating, review, id]
  );

  return result.rows[0];
};

exports.deleteMedia = async (id) => {
  const media = await exports.getMediaById(id);
  if (!media) throw new Error("Media not found");

  const result = await query(
    "DELETE FROM media WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

exports.filterMedia = async (type) => {
  const result = await query(
    "SELECT * FROM media WHERE type = $1 ORDER BY created_at DESC",
    [type]
  );
  return result.rows;
};