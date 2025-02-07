import express from 'express';
import multer from 'multer';
import progress from 'progress-stream';
import path from 'path';

const app = express();
const port = 3000;

// Set up storage with multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.use(express.static('public'));

// Upload route with progress tracking
app.post('/upload', (req, res) => {
  const progressStream = progress();
  progressStream.on('progress', (progress) => {
    console.log(progress); // Log progress to the console
    // You can emit the progress to the client using WebSockets or SSE
    // For example: req.io.emit('uploadProgress', progress);
  });

  const uploadMiddleware = upload.single('file');

  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // The file has been uploaded successfully
    res.status(200).json({ message: 'File uploaded successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
