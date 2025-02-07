import chalk from 'chalk';

class FileModel {
  constructor(database) {
    this.database = database;
  }

  async uploadFile(originalname, mimetype, filename, path, size) {
    const query = 'INSERT INTO uploaded_files (original_name, mimetype, filename, path, size) VALUES (?, ?, ?, ?, ?)';
    let conn;
    try {
      conn = await this.database.getConnection(); // Get a connection from the pool
      const result = await conn.query(query, [originalname, mimetype, filename, path, size]);
      return result;
    } catch (error) {
      console.log(chalk.red('Database Error: ', error));
      return error;
    } finally {
      if (conn) conn.release(); // Always release the connection back to the pool
    }
  }

  async getAllVideos() {
    const query = "SELECT * FROM uploaded_files";
    let conn;
    try {
      conn = await this.database.getConnection();
      const result = await conn.query(query);
      return result;
    } catch (error) {
      console.log(chalk.red('Database Error: ', error));
      return error;
    } finally {
      if (conn) conn.release();
    }
  }
}

export default FileModel;
