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
    
    const io = req.io; // Get Socket.IO instance from the request
    const socketId = req.headers['socket-id']; // Get client's socket ID
    const socket = io.sockets.sockets.get(socketId);
    // console.log('Socket ID:', socketId);
    // console.log('Socket:', socket);
    // console.log('io:', io);
    if (!socket) {
      console.error('Socket not found');
      return res.status(400).send('Socket not found');
    }
    try {
      await processVideo(`./uploads/${file.filename}`, (resolution, percent,applicableResolutions) => {
        console.log(`Processing ${resolution}: ${percent}% complete (${JSON.stringify(applicableResolutions)})`);
        if (socket) {
          socket.emit('processing-progress', { resolution, percent, applicableResolutions: JSON.stringify(applicableResolutions) });
        }
      });
      console.log('Video processing completed!');
      
      // Add To Database
      const { title, description } = req.body;
      let result = await fileModel.uploadFile(file.filename.split('.')[0], title, description, 0);
  
      console.log(result);

      // After Uploading Delete the .mp4 file
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
