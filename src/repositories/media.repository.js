const { query } = require("../database/pgDatabase");

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
  
  // If no new image was uploaded, keep the existing one
  const finalImageUrl = imageUrl !== undefined ? imageUrl : existingMedia.image_url;

  // Build SET clause dynamically
  let setClause = [];
  let params = [];
  let paramIndex = 1;
  
  // Only update fields that were provided
  if (title !== undefined) {
    setClause.push(`title = $${paramIndex++}`);
    params.push(title);
  }
  
  if (type !== undefined) {
    setClause.push(`type = $${paramIndex++}`);
    params.push(type);
  }
  
  if (status !== undefined) {
    setClause.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  
  // Always include image_url in the update
  setClause.push(`image_url = $${paramIndex++}`);
  params.push(finalImageUrl);
  
  if (rating !== undefined) {
    setClause.push(`rating = $${paramIndex++}`);
    params.push(rating);
  }
  
  if (review !== undefined) {
    setClause.push(`review = $${paramIndex++}`);
    params.push(review);
  }
  
  // Add id as the last parameter
  params.push(id);
  
  const queryText = `
    UPDATE media 
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(queryText, params);
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