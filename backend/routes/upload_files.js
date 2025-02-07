import express from 'express';
import multer from 'multer';
import fs from 'fs';
import FileModel from '../models/file_model.js';
import DB from '../config/db.js';
import processVideo from '../generate-res.mjs';
import { generateSecureUniqueID } from '../common/utils.js';

const fileModel = new FileModel(DB);

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = generateSecureUniqueID(11) + "." + file.mimetype.split('/')[1];
        cb(null, uniqueSuffix);
    }
})
const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
    let files = await fileModel.getAllVideos();
    res.json({ files: files });
})
router.get("/upload", (req, res) => {
    res.json({ "message": "I am working, use post method to upload the file." })
})

router.post('/upload', upload.single('video'), async (req, res) => {
    req.on('fileUploadProgress', (data) => {
        console.log(`File upload progress: ${data.progress}`);
    });
    try {
        const file = req.file;
        let result = await fileModel.uploadFile(file?.originalname, file?.mimetype, file?.filename, file?.path, file?.size);
        console.log(result);
        if (!file) {
            res.status(400).send('Please upload a file');
        } else {
            try {
                await processVideo("./" + file.path, (resolution, percent) => {
                    console.log(`Processing ${resolution}: ${percent}% complete`);
                });
                console.log('Video processing completed!');

                // Delete the file after processing
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log('File deleted successfully');
                    }
                });

                res.json({ message: 'File uploaded and processed successfully' });
            } catch (err) {
                console.error('Error processing video:', err);
                res.json(err);
            }
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

export { router as UploadFiles }