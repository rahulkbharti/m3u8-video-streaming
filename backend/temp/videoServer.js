import express from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import dotenv from 'dotenv';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import cors from 'cors';
import fs from 'fs';
import path from 'path';


ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const environment = process.env.NODE_ENV || 'development';
// Load environment variables
dotenv.config({ path: `.env.${environment}` });

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Azure Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Multer Setup (For File Uploads)
const upload = multer({ storage: multer.memoryStorage() });

// Function to Upload MP4 to Azure
const uploadToAzure = async (buffer, fileName) => {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(buffer);
    console.log(`✅ Uploaded MP4 to Azure: ${fileName}`);
};

// Function to Get Readable Stream from Azure
const getAzureReadableStream = async (blobName) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();
    return downloadResponse.readableStreamBody;
};

// Function to Upload HLS Segments to Azure
const uploadHLSToAzure = async (localFolderPath, resolutionName) => {
    const files = fs.readdirSync(localFolderPath);

    for (const file of files) {
        const filePath = path.join(localFolderPath, file);
        const blobName = `videos/${resolutionName}/${file}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        console.log(`⬆️ Uploading ${file} to Azure...`);
        await blockBlobClient.uploadFile(filePath);
    }

    console.log(`✅ All HLS files uploaded to Azure.`);
};

// Function to Delete File from Azure
const deleteFromAzure = async (blobName) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    console.log(`🗑️ Deleted MP4 from Azure: ${blobName}`);
};

// Function to Process Video into HLS and Upload to Azure
const processVideo = async (blobInputName, resolution, SEGMENT_DURATION = 10) => {
    console.log(`🚀 Processing video: ${blobInputName} at resolution ${resolution.name}`);

    const inputStream = await getAzureReadableStream(blobInputName);
    const tempOutputPath = `./temp/${resolution.name}/`;
    fs.mkdirSync(tempOutputPath, { recursive: true });

    return new Promise((resolve, reject) => {
        ffmpeg(inputStream)
            .videoCodec('libx264')
            .size(`${resolution.width}x${resolution.height}`)
            .addOption([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                '-hls_time', SEGMENT_DURATION.toString(),
                '-hls_list_size', '0',
                '-f', 'hls',
                '-hls_segment_type', 'mpegts',
                `-hls_segment_filename ${tempOutputPath}segment_%03d.ts`,
            ])
            .output(`${tempOutputPath}playlist.m3u8`)
            .on('progress', (progress) => console.log(`Progress: ${progress.percent}%`))
            .on('end', async () => {
                console.log(`✅ Processing Completed: ${resolution.name}`);
                
                // Upload HLS files to Azure
                await uploadHLSToAzure(tempOutputPath, resolution.name);

                // Delete local temp files
                fs.rmSync(tempOutputPath, { recursive: true, force: true });

                // Delete the original MP4 from Azure
                await deleteFromAzure(blobInputName);

                resolve();
            })
            .on('error', (err) => {
                console.error(`❌ Error processing ${resolution.name}:`, err);
                reject(err);
            })
            .run();
    });
};

// Route: Upload MP4 File
app.post('/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded.');

        const fileName = `videos/${req.file.originalname}`;
        await uploadToAzure(req.file.buffer, fileName);

        // Start processing after upload
        await processVideo(fileName, { name: '360', width: 640, height: 360 });

        res.json({ message: 'Video uploaded & processing started.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
