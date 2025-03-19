import express from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import dotenv from 'dotenv';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import cors from 'cors';



ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
// Enable CORS for all requests
app.use(cors());
const PORT = process.env.PORT || 5000;

const environment = process.env.NODE_ENV || 'development';
// Load environment variables
dotenv.config({ path: `.env.${environment}` });

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

// Function to Create Writable Stream to Azure
const getAzureWritableStream = async (blobName) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const passThroughStream = new PassThrough();
    blockBlobClient.uploadStream(passThroughStream);
    return passThroughStream;
};

// Function to Process Video and Store HLS in Azure
const processVideo = async (blobInputName, resolution, SEGMENT_DURATION = 10) => {
    console.log(`🚀 Processing video: ${blobInputName} at resolution ${resolution.name}`);

    const inputStream = await getAzureReadableStream(blobInputName);
    const playlistBlobName = `videos/${resolution.name}/playlist.m3u8`;
    const playlistStream = await getAzureWritableStream(playlistBlobName);

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
                '-hls_segment_filename', `pipe:1`,
            ])
            .output('pipe:1')
            .on('progress', (progress) => console.log(`Progress: ${progress.percent}%`))
            .on('end', async () => {
                console.log(`✅ Processing & Uploading Completed: ${resolution.name}`);
                await deleteFromAzure(blobInputName);
                resolve();
            })
            .on('error', (err) => {
                console.error(`❌ Error processing ${resolution.name}:`, err);
                reject(err);
            })
            .pipe(playlistStream, { end: true });
    });
};

// Function to Delete File from Azure
const deleteFromAzure = async (blobName) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    console.log(`🗑️ Deleted MP4 from Azure: ${blobName}`);
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
