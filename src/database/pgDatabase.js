const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connect = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to the database");
    client.release();
  } catch (error) {
    console.error("Error connecting to the database", error);
    // Don't throw - allow the app to start even with DB issues
  }
};

// Try connecting but don't block app startup
connect().catch(err => {
  console.error("Initial database connection failed:", err.message);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: ${text.substring(0, 50)}... in ${duration}ms`);
    return res;
  } catch (error) {
    console.error("Error executing query:", error.message);
    console.error("Query was:", text);
    console.error("Params were:", params);
    throw error;
  }
};

module.exports = { query };