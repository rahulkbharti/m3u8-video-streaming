import express from 'express';
import { UploadFiles } from './routes/upload_files.js';
import { VideoStream } from './routes/video_stream.js';
const router = express.Router();

router.use("/files",UploadFiles);
router.use("/watch",VideoStream);
export {router as MainRoutes};

