import express from 'express';
import path from 'path';
import {
    BlobServiceClient,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    StorageSharedKeyCredential
} from '@azure/storage-blob';
import dotenv from 'dotenv';
import fileModel from '../models/file_model.js';

const environment = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${environment}` });

const router = express.Router();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;
const ACCOUNT_NAME = process.env.AZURE_ACCOUNT_NAME;
const ACCOUNT_KEY = process.env.AZURE_ACCOUNT_KEY;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
const sharedKeyCredential = new StorageSharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY);

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

const generateSasUrl = (blobName, expiryMinutes = 10) => {
    try {
        const blobClient = containerClient.getBlobClient(blobName);
        const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);

        const sasToken = generateBlobSASQueryParameters({
            containerName: CONTAINER_NAME,
            blobName,
            permissions: BlobSASPermissions.parse("r"),
            expiresOn,
        }, sharedKeyCredential).toString();
        return `${blobClient.url}?${sasToken}`;
    } catch (error) {
        console.error(`Error generating SAS URL for blob: ${blobName}`, error);
        throw new Error('Failed to generate SAS URL');
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

// 📌 Stream M3U8 Playlist
router.get('/:videoId/master.m3u8', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/master.m3u8`, res);
});

router.get('/:videoId/:resolution/playlist.m3u8', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/${req.params.resolution}/output.m3u8`, res);
});

// 📌 Stream Poster & Thumbnails
router.get('/:videoId/poster.png', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/poster.png`, res);
});

router.get('/:videoId/thumbnails.vtt', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/thumbnails.vtt`, res);
});

router.get('/:videoId/thumbnails/:thumbnail', async (req, res) => {
    await streamBlob(`streams/${req.params.videoId}/thumbnails/${req.params.thumbnail}`, res);
});

// 📌 Redirect segment.ts → Signed URL
router.get('/:videoId/:resolution/:segment', async (req, res) => {
    const { videoId, resolution, segment } = req.params;
    const ext = path.extname(segment); // check extension (.ts or .m3u8)
  
    if (ext === '.m3u8') {
      // It's a playlist, stream it with signed .ts links
      const blobName = `streams/${videoId}/${resolution}/${segment}`;
      try {
        const blobClient = containerClient.getBlobClient(blobName);
        const downloadResponse = await blobClient.download();
  
        let content = '';
        for await (const chunk of downloadResponse.readableStreamBody) {
          content += chunk.toString();
        }
  
        const basePath = `streams/${videoId}/${resolution}/`;
        const signedContent = content.replace(/(segment\d+\.ts)/g, (match) => {
          const signedUrl = generateSasUrl(`${basePath}${match}`);
          return signedUrl;
        });
  
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(signedContent);
      } catch (err) {
        console.error("❌ Error streaming signed playlist:", err);
        res.status(500).send("Internal Server Error");
      }
    } else {
      // It's a .ts segment, redirect to signed URL
      const blobName = `streams/${videoId}/${resolution}/${segment}`;
      try {
        console.info(`Generating signed URL for segment: ${blobName}`);
        const signedUrl = generateSasUrl(blobName);
        res.redirect(signedUrl);
      } catch (err) {
        console.error("❌ Error generating signed segment URL:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

export { router as VideoStream };
