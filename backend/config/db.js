import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import chalk from 'chalk';

const CONNECTION_LIMIT = 100;
const environment = process.env.NODE_ENV || 'development';

// Load environment variables
dotenv.config({ path: `.env.${environment}` });

// PostgreSQL connection options
const dbOptions = {
  connectionString: process.env.DATABASE_URL, // Use external PostgreSQL URL
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: CONNECTION_LIMIT, // Connection pool limit
};

// Create a PostgreSQL connection pool
const DB = new Pool(dbOptions);

DB.on('connect', () => console.log(chalk.blue(`✅ PostgreSQL Connected - Pool Limit: ${CONNECTION_LIMIT}`)));
DB.on('error', (err) => console.error(chalk.red('❌ PostgreSQL Error:'), err));

/**
 * Creates the videos table if it does not exist
 */
const deleteTable = async () => {
  const query = 'DROP TABLE IF EXISTS videos;';

  try {
    await DB.query(query);
    console.log(chalk.green('✅ "videos" Table Deleted!'));
  } catch (err) {
    console.error(chalk.red('❌ Error deleting table:'), err);
  }
};

// Run table deletion
deleteTable();

const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,                -- Auto-incremented primary key
        videoId CHAR(11) UNIQUE NOT NULL,     -- User-provided unique 11-character video ID
        title VARCHAR(255) NOT NULL,          -- Video title
        description TEXT,                      -- Video description
        duration INT NOT NULL,                -- Duration in seconds
        created_at TIMESTAMP DEFAULT NOW()    -- Timestamp when added
    );
  `;

  try {
    await DB.query(query);
    console.log(chalk.green('✅ "videos" Table is Ready!'));
  } catch (err) {
    console.error(chalk.red('❌ Error creating table:'), err);
  }
};

// Run table creation
createTable();

/**
 * Tests the database connection
 */
async function testConnection() {
  try {
    const { rows } = await DB.query('SELECT NOW() AS current_time');
    console.log(chalk.green(`✅ Database Connected! Current Time: ${rows[0].current_time}`));
  } catch (err) {
    console.error(chalk.red('❌ Database Connection Error:'), err);
  }
}

// Test connection
// testConnection();

export default DB;
