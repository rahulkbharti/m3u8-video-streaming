import express from 'express';
import { UploadFiles } from './routes/upload_files.js';
import { VideoStream } from './routes/video_stream.js';
const router = express.Router();
import path from 'path';

router.use("/files", UploadFiles);
router.use("/watch", VideoStream);
router.get('/view', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/index.html'));
});
export { router as MainRoutes };

