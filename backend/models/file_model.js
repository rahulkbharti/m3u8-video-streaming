// userModel.js
import util from 'util';
import chalk from 'chalk';

class FileModel {
  constructor(database) {
    this.database = database;
    this.query = util.promisify(database.query).bind(database);
  }
  async uploadFile(originalname, mimetype, filename, path, size){
    const query = 'INSERT INTO uploaded_files (original_name, mimetype, filename, path, size) VALUES (?, ?, ?, ?, ?)';
    try {
      const result = await this.query(query,[originalname, mimetype, filename, path, size]);
      return result;
    } catch (error) {
      console.log(chalk.red(error));
      return error;
    }
  } 
  async getAllVideos(){
    const query = "SELECT * FROM uploaded_files";
    try{
      const result = await this.query(query);
      return result;
    }catch(error){
      console.log(chalk.red(error));
      return error;
    }
  }
}

export default FileModel;
