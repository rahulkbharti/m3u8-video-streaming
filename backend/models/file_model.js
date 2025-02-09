import chalk from 'chalk';

class FileModel {
  constructor(database) {
    this.database = database;
  }

  // Upload a video file to the database
  async uploadFile(videoId, title, description, duration) {
    const query = `INSERT INTO videos (videoId, title, description, duration) 
                   VALUES ($1, $2, $3, $4) RETURNING *`;
    try {
      const result = await this.database.query(query, [videoId, title, description, duration]);
      return result.rows[0]; // Return the inserted video data
    } catch (error) {
      console.log(chalk.red('Database Error: ', error));
      return error;
    }
  }

  // Get all videos
  async getAllVideos() {
    const query = "SELECT * FROM videos";
    try {
      const result = await this.database.query(query);
      return result.rows; // Return all videos
    } catch (error) {
      console.log(chalk.red('Database Error: ', error));
      return error;
    }
  }

  // Get a specific video by videoId
  async getVideoByVideoId(videoId) {
    const query = "SELECT * FROM videos WHERE videoId = $1";
    try {
      const result = await this.database.query(query, [videoId]);
      return result.rows[0] || null; // Return video if found, else null
    } catch (error) {
      console.log(chalk.red('Database Error: ', error));
      return error;
    }
  }
}

export default FileModel;
