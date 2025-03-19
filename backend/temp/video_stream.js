import express from 'express';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import dotenv from 'dotenv';
import fileModel from '../models/file_model.js';

const environment = process.env.NODE_ENV || 'development';
// Load environment variables
dotenv.config({ path: `.env.${environment}` });

const router = express.Router();

// Azure Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

/**
 * Generate a SAS (Shared Access Signature) URL for a given blob
 * @param {string} blobName - The path of the blob in Azure Storage
 * @param {number} expiryTimeInMinutes - Expiry time in minutes
 * @returns {string} - Signed URL with limited-time access
 */
const generateSasUrl = async (blobName, expiryTimeInMinutes = 60) => {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + expiryTimeInMinutes);

    const sasToken = generateBlobSASQueryParameters({
        containerName: CONTAINER_NAME,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // Read-only permission
        expiresOn: expiry
    }, blockBlobClient.credential).toString();

    return `${blockBlobClient.url}?${sasToken}`;
};

// 📌 Get All Videos
router.get("/", async (req, res) => { 
    try {
        const files = await fileModel.getAllVideos();
        const processedFiles = files.map(file =>
            Object.fromEntries(Object.entries(file).map(([key, value]) =>
                [key, typeof value === "bigint" ? value.toString() : value]
            ))
        );
        res.json({ files: processedFiles });
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

        const processedFile = Object.fromEntries(Object.entries(file).map(([key, value]) =>
            [key, typeof value === "bigint" ? value.toString() : value]
        ));

        res.json({ file: processedFile });
    } catch (err) {
        console.error("❌ Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Serve Master Playlist (master.m3u8)
router.get('/:videoId/master.m3u8', async (req, res) => {
    try {
        const sasUrl = await generateSasUrl(`streams/${req.params.videoId}/master.m3u8`);
        return res.redirect(sasUrl);
    } catch (error) {
        console.error("❌ Error fetching master.m3u8:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Stream Poster
router.get('/:videoId/poster.png', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/poster.png`, res);
});

// 📌 Serve Thumbnails VTT (WebVTT)
router.get('/:videoId/thumbnails.vtt', async (req, res) => {
    try {
        const sasUrl = await generateSasUrl(`streams/${req.params.videoId}/thumbnails.vtt`);
        return res.redirect(sasUrl);
    } catch (error) {
        console.error("❌ Error fetching thumbnails.vtt:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Serve Individual Thumbnails
router.get('/:videoId/thumbnails/:thumbnail', async (req, res) => {
    try {
        const sasUrl = await generateSasUrl(`streams/${req.params.videoId}/thumbnails/${req.params.thumbnail}`);
        return res.redirect(sasUrl);
    } catch (error) {
        console.error("❌ Error fetching thumbnail:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Serve Resolution-Based Playlist (e.g., 360p/output.m3u8)
router.get('/:videoId/:resolution/playlist.m3u8', async (req, res) => {
    try {
        const sasUrl = await generateSasUrl(`streams/${req.params.videoId}/${req.params.resolution}/output.m3u8`);
        return res.redirect(sasUrl);
    } catch (error) {
        console.error("❌ Error fetching resolution playlist:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Serve Individual Video Segments (e.g., 360p/seg0001.ts)
router.get('/:videoId/:resolution/:segment', async (req, res) => {
    try {
        const sasUrl = await generateSasUrl(`streams/${req.params.videoId}/${req.params.resolution}/${req.params.segment}`);
        return res.redirect(sasUrl);
    } catch (error) {
        console.error("❌ Error fetching video segment:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export { router as VideoStream };
