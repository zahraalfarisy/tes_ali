const { query, cloudinary } = require("../database/pgDatabase");

exports.getAllMedia = async () => {
  const result = await query("SELECT * FROM media ORDER BY created_at DESC");
  return result.rows;
};

exports.getMediaById = async (id) => {
  const result = await query("SELECT * FROM media WHERE id = $1", [id]);
  return result.rows[0];
};

exports.createMedia = async (mediaData, image) => {
  let imageUrl = null;

  if (image) {
    try {
      const uploadRes = await cloudinary.uploader.upload(image.path);
      imageUrl = uploadRes.secure_url;
      fs.unlink(image.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw new Error(`Image upload failed: ${err.message}`);
    }
  }

  const { title, type, status, rating, review } = mediaData;

  const result = await query(
    "INSERT INTO media (title, type, status, image_url, rating, review) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [title, type, status, imageUrl, rating, review]
  );

  return result.rows[0];
};

exports.updateMedia = async (id, mediaData, image) => {
  const existingMedia = await exports.getMediaById(id);
  if (!existingMedia) throw new Error("Media not found");

  let imageUrl = existingMedia.image_url;

  if (image) {
    try {
      const uploadRes = await cloudinary.uploader.upload(image.path);
      imageUrl = uploadRes.secure_url;
      fs.unlink(image.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw new Error(`Image upload failed: ${err.message}`);
    }
  }

  const { title, type, status, rating, review } = mediaData;

  const result = await query(
    `UPDATE media 
     SET title = COALESCE($1, title), 
         type = COALESCE($2, type), 
         status = COALESCE($3, status), 
         image_url = $4, 
         rating = COALESCE($5, rating), 
         review = COALESCE($6, review) 
     WHERE id = $7 RETURNING *`,
    [title, type, status, imageUrl, rating, review, id]
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
