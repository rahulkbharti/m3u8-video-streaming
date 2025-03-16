import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import fileModel from '../models/file_model.js';
import processVideo from '../generate-res.mjs';
import { generateSecureUniqueID } from '../common/utils.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = generateSecureUniqueID(11) + '.' + file.mimetype.split('/')[1];
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  let files = await fileModel.getAllVideos();
  res.json({ files });
});

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('Please upload a file');

    const { title, description } = req.body;
    let result = await fileModel.uploadFile(file.filename.split('.')[0], title, description, 0);

    console.log(result);
    try {
      await processVideo(`./uploads/${file.filename}`, (resolution, percent) => {
        console.log(`Processing ${resolution}: ${percent}% complete`);
      });
      console.log('Video processing completed!');
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
        else console.log('File deleted successfully');
      });
      res.json({ message: 'File uploaded and processed successfully' });
    } catch (err) {
      console.error('Error processing video:', err);
      res.status(500).json(err);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

export { router as UploadFiles };
