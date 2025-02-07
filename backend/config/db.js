import mariadb from 'mariadb';
import dotenv from 'dotenv';
import chalk from 'chalk';

const CONNECTION_LIMIT = 100;
const environment = process.env.NODE_ENV || 'development';

// Load the appropriate .env file
dotenv.config({
  path: `.env.${environment}`
});

// MariaDB connection options
const dbOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATA_BASE,
  connectionLimit: CONNECTION_LIMIT
};

// Create a MariaDB connection pool
const DB = mariadb.createPool(dbOptions);

console.log(chalk.blue(`MariaDB Pool Created Successfully with limit ${CONNECTION_LIMIT}`));

/*******
 TEST CODE :
 Uncomment the following code to test the database connection
********/
// async function testConnection() {
//   let conn;
//   try {
//     conn = await DB.getConnection();
//     const rows = await conn.query("SELECT 1 as val");
//     console.log(rows); // Output: [{ val: 1 }]
//   } catch (err) {
//     console.error("Database Error: ", err);
//   } finally {
//     if (conn) conn.release(); // Important: release the connection back to the pool
//   }
// }

// testConnection();

export default DB;
