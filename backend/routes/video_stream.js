import path from 'path';
import express from 'express';
import fileModel from '../models/file_model.js';

const router = express.Router();

router.get("/", async (req, res) => { 
    try {
        const files = await fileModel.getAllVideos();

        // Convert BigInt values to string before sending JSON response
        const processedFiles = files.map(file =>
            Object.fromEntries(Object.entries(file).map(([key, value]) =>
                [key, typeof value === "bigint" ? value.toString() : value]
            ))
        );

        res.json({ files: processedFiles });
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/:videoId/master.m3u8', (req, res) => {
    res.sendFile(path.resolve(`streams/${req.params.videoId}/master.m3u8`));
});

router.get('/:videoId/thumbnails.vtt', (req, res) => {
    res.sendFile(path.resolve(`streams/${req.params.videoId}/thumbnails.vtt`));
});

router.get('/:videoId/thumbnails/:thumbnail', (req, res) => {
    res.sendFile(path.resolve(`streams/${req.params.videoId}/thumbnails/${req.params.thumbnail}`));
});

router.get('/:videoId/:resolution/playlist.m3u8', (req, res) => {
    res.sendFile(path.resolve(`streams/${req.params.videoId}/${req.params.resolution}/output.m3u8`));
});

router.get('/:videoId/:resolution/:segment', (req, res) => {
    res.sendFile(path.resolve(`streams/${req.params.videoId}/${req.params.resolution}/${req.params.segment}`));
});

export { router as VideoStream };
