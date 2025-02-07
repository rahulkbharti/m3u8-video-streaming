import path from 'path';
import express from 'express';

const router = express.Router();
/**
 * This route will return an .m3u8 file with all video file segments info
 * If you don't have any files in /segments folder -> run "generate.mjs" file:
 * it will create a m3u8 list with segmented videos.
 */
router.get("/", (req, res) => {
    res.status(400).json({ messahge: "Video ID is required" });
})
router.get('/:videoId/master.m3u8', (request, response) => {
    const { videoId, } = request.params;
    const resolvedPath = path.resolve(`streams/${videoId}/master.m3u8`);
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
