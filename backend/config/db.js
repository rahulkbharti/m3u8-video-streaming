import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import chalk from 'chalk';

const environment = process.env.NODE_ENV || 'development';

// Load environment variables
dotenv.config({ path: `.env.${environment}` });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

async function connectDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db(process.env.MONGODB_DB_NAME);
      console.log(chalk.blue('✅ MongoDB Connected'));
    } catch (err) {
      console.error(chalk.red('❌ MongoDB Connection Error:'), err);
    }
  }
  return db;
}

export { connectDB, client };
