import path from 'path';
import express from 'express';
import DB from '../config/db.js';
import FileModel from '../models/file_model.js';
const router = express.Router();
const fileModel = new FileModel(DB);
/**
 * This route will return an .m3u8 file with all video file segments info
 * If you don't have any files in /segments folder -> run "generate.mjs" file:
 * it will create a m3u8 list with segmented videos.
 */
router.get("/", (res) => {
    try {
        fileModel.getAllVideos().then((files) => {
            // Convert BigInt values to string before sending JSON response
            const processedFiles = files.map(file =>
                Object.fromEntries(Object.entries(file).map(([key, value]) =>
                    [key, typeof value === "bigint" ? value.toString() : value]
                ))
            );

            res.json({ files: processedFiles }); // Send JSON directly
            // console.log(processedFiles);
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})
router.get('/:videoId/master.m3u8', (request, response) => {
    const { videoId } = request.params;
    const resolvedPath = path.resolve(`streams/${videoId}/master.m3u8`);
    response.sendFile(resolvedPath);
});
router.get('/:videoId/thumbnails.vtt', (request, response) => {
    const { videoId } = request.params;
    const resolvedPath = path.resolve(`streams/${videoId}/thumbnails.vtt`);
    response.sendFile(resolvedPath);
});

router.get('/:videoId/thumbnails/:thumbnail', (request, response) => {
    const { videoId, thumbnail } = request.params;
    const resolvedPath = path.resolve(`streams/${videoId}/thumbnails/${thumbnail}`);
    response.sendFile(resolvedPath);
});
router.get('/:videoId/:resolution/playlist.m3u8', (request, response) => {
    const { videoId, resolution } = request.params;
    const resolvedPath = path.resolve(`streams/${videoId}/${resolution}/output.m3u8`);
    response.sendFile(resolvedPath);
});

/**
 * Will return specific video segment, like "file149.ts" from the /videos folder
 */
router.get('/:videoId/:resolution/:segment', (request, response) => {
    const { videoId, resolution, segment } = request.params;
    const resolvedPath = path.resolve(`streams/${videoId}/${resolution}/${segment}`);
    response.sendFile(resolvedPath);
});




export { router as VideoStream };
