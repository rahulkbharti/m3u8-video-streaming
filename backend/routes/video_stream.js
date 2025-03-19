import express from 'express';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import dotenv from 'dotenv';
import fileModel from '../models/file_model.js';

const environment = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${environment}` });

const router = express.Router();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

const streamBlob = async (blobName, res) => {
    try {
        const blobClient = containerClient.getBlobClient(blobName);
        const downloadBlockBlobResponse = await blobClient.download();
        
        if (!downloadBlockBlobResponse.readableStreamBody) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.setHeader('Content-Type', downloadBlockBlobResponse.contentType || 'application/octet-stream');
        res.setHeader('Content-Length', downloadBlockBlobResponse.contentLength);
        
        downloadBlockBlobResponse.readableStreamBody.pipe(res);
    } catch (error) {
        console.error(`Error streaming blob: ${blobName}`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// 📌 Get All Videos
router.get("/", async (req, res) => {
    try {
        const files = await fileModel.getAllVideos();
        res.json({ files });
    } catch (err) {
        console.error("❌ Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Get Video Details by ID
router.get("/:videoId", async (req, res) => {
    try {
        const file = await fileModel.getVideoByVideoId(req.params.videoId);
        if (!file) return res.status(404).json({ message: "Video not found" });
        res.json({ file });
    } catch (err) {
        console.error("❌ Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Stream Master Playlist (master.m3u8)
router.get('/:videoId/master.m3u8', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/master.m3u8`, res);
});

// 📌 Stream Thumbnails VTT (WebVTT)
router.get('/:videoId/thumbnails.vtt', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/thumbnails.vtt`, res);
});
// 📌 Stream Poster
router.get('/:videoId/poster.png', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/poster.png`, res);
});
// 📌 Stream Individual Thumbnails
router.get('/:videoId/thumbnails/:thumbnail', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/thumbnails/${req.params.thumbnail}`, res);
});

// 📌 Stream Resolution-Based Playlist (e.g., 360p/output.m3u8)
router.get('/:videoId/:resolution/playlist.m3u8', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/${req.params.resolution}/output.m3u8`, res);
});

// 📌 Stream Individual Video Segments (e.g., 360p/seg0001.ts)
router.get('/:videoId/:resolution/:segment', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/${req.params.resolution}/${req.params.segment}`, res);
});

export { router as VideoStream };