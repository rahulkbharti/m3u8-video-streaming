import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import fileModel from '../models/file_model.js';
import { generateSecureUniqueID } from '../common/utils.js';
import { deleteAzureDirectory} from '../azureUploader.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = generateSecureUniqueID(11) + '.' + file.mimetype.split('/')[1];
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('Please upload a file');

    const io = req.io; // Get Socket.IO instance from the request
    const socketId = req.headers['socket-id']; // Get client's socket ID
    const socket = io.sockets.sockets.get(socketId);

    if (!socket) {
      console.error('Socket not found');
      return res.status(400).send('Socket not found');
    }

    const worker = new Worker('./routes/videoWorker.js', {
      workerData: { filePath: `./uploads/${file.filename}` },
    });

    worker.on('message', (data) => {
      if (data.status === 'completed') {
        console.log('Video processing completed!');

        // Add To Database
        const { title, description } = req.body;
        fileModel.uploadFile(file.filename.split('.')[0], title, description, 0).then(() => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('File deleted successfully');
          });
          res.json({ message: 'File uploaded and processed successfully' });
        }).catch((err) => {
          console.error('Database error:', err);
          res.status(500).json(err);
        });
      } else {
        socket.emit('processing-progress', data);
      }
    });

    worker.on('error', (err) => {
      console.error('Worker error:', err);
      res.status(500).send('Error processing video');
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`Worker exited with code ${code}`);
    });

  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/delete/:videoId', async (req, res) => {
  console.info("Video Delete Request");
  try {
    const { videoId } = req.params;

    const video = await fileModel.getVideoByVideoId(videoId);
    if (!video) {
      return res.status(404).send('Video not found');
    }

    // 🚀 Delete video folder from Azure Blob Storage
    if(!deleteAzureDirectory(`streams/${videoId}`)) return   res.json({ message: 'Video is not deleted from Azure ' }); // Make sure this function deletes all .ts + .m3u8 for this video

    // 🗂 Remove metadata from DB
    const deleteResult = await fileModel.deleteVideoById(videoId);
    if (deleteResult) {
      res.json({ message: 'Video deleted from Azure and DB' });
    } else {
      res.status(500).send('Error deleting video from database');
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error');
  }
});

export { router as UploadFiles };
