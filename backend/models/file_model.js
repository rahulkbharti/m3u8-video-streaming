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
      return await this.collection.find({})
        .sort({ createdAt: -1 }) // -1 for descending order
        .toArray();
    } catch (error) {
      console.log(chalk.red('Database Error:', error));
      return error;
    }
  }
  

  async getVideoByVideoId(videoId) {
    try {
      const result = await this.database.collection('videos').findOne(
        { videoId },
        // { projection: { videoId: 1, _id: 0 } } // Only return videoId, exclude _id
      );
      return result ? result : null; // Return videoId if found, else null
    } catch (error) {
      console.log(chalk.red('Database Error: ', error));
      return error;
    }

  }

  // Search videos by title
  async searchVideosByTitle(title) {
    try {
      const result = await this.database.collection('videos').find({
        title: { $regex: title, $options: 'i' } // Case-insensitive search
      }).toArray();
      return result; // Return matching videos
    } catch (error) {
      console.log(chalk.red('Database Error: ', error));
      return error;
    }
  }

  async deleteVideoById(videoId) {
    try {
      const result = await this.collection.deleteOne({ videoId });
      return result.deletedCount > 0; // Return true if a document was deleted
    } catch (error) {
      console.log(chalk.red('Database Error:', error));
      return error;
    }
  }
}

export default new FileModel();
