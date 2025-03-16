import chalk from 'chalk';
import { connectDB } from '../config/db.js';

class FileModel {
  constructor() {
    this.init();
  }

  async init() {
    this.database = await connectDB();
    this.collection = this.database.collection('videos');
  }

  async uploadFile(videoId, title, description, duration) {
    try {
      const result = await this.collection.insertOne({
        videoId,
        title,
        description,
        duration,
        createdAt: new Date(),
      });
      return result;
    } catch (error) {
      console.log(chalk.red('Database Error:', error));
      return error;
    }
  }

  async getAllVideos() {
    try {
      return await this.collection.find({}).toArray();
    } catch (error) {
      console.log(chalk.red('Database Error:', error));
      return error;
    }
  }

  async getVideoByVideoId(videoId) {
    try {
      return await this.collection.findOne({ videoId });
    } catch (error) {
      console.log(chalk.red('Database Error:', error));
      return error;
    }
  }
}

export default new FileModel();
