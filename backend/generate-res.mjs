import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const SEGMENT_DURATION = 6;

// Get video resolution
const getVideoResolution = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.streams[0]);
        });
    });
};

// Extract file name without extension
const getFileNameWithoutExtension = (filePath) =>
    path.basename(filePath, path.extname(filePath));

// Ensure directory exists
const createDirectories = (dirPath) => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

// Count the number of .ts segments in a directory
const countTsSegments = (resolutionPath) => {
    return fs.readdirSync(resolutionPath)
        .filter(file => file.endsWith('.ts'))
        .length;
};

// Process video at a specific resolution
const processResolution = (filePath, resolutionPath, resolution, onProgress,applicableResolutions) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath, { timeout: 432000 })
            .videoCodec('libx264')
            .size(`${resolution.width}x${resolution.height}`)
            .addOption([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                `-hls_segment_filename ${path.join(resolutionPath, 'segment%03d.ts')}`,
                `-hls_time ${SEGMENT_DURATION}`,
                '-hls_list_size 0',
                '-f hls',
            ])
            .output(path.join(resolutionPath, `playlist-${resolution.name}.m3u8`))
            .on('end', () => resolve(console.log(`✅ Transcoding completed: ${resolution.name}`)))
            .on('progress', (progress) => onProgress?.(resolution.name, progress.percent,applicableResolutions))
            .on('error', (err) => reject(console.error(`❌ Error processing ${resolution.name}:`, err)))
            .run();
    });
};

// Create master M3U8 file
const createMasterM3U8 = (baseOutputPath, resolutions) => {
    const masterM3U8Path = path.join(baseOutputPath, 'master.m3u8');
    const bandwidths = { '1080p': 2000000, '720p': 1500000, '480p': 1000000, '360p': 600000 };

    const masterM3U8Content = resolutions.map(res =>
        `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidths[res.name] || 500000},RESOLUTION=${res.width}x${res.height}
${path.join(res.name, `playlist-${res.name}.m3u8`)}`
    ).join('\n');

    fs.writeFileSync(masterM3U8Path, `#EXTM3U\n${masterM3U8Content}`);
    console.log('🎬 Master M3U8 created successfully!');
};

const generatePosterThumbnail = (filePath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .on('end', () => {
                console.log('📸 Poster thumbnail created in', outputPath);
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ Error generating poster thumbnail:', err);
                reject(err);
            })
            .screenshots({
                timestamps: ['5%'], // Capture a frame at 5% of the video duration
                filename: 'poster.png', // Save as poster.png
                folder: outputPath, // Save in the same folder as the .m3u8 files
                size: '640x360' // Adjust thumbnail size as needed
            });
    });
};

// Generate video thumbnails matching .ts segment count
const generateThumbnails = async (filePath, thumbnailPath, segmentPath) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const tsCount = countTsSegments(segmentPath);
                if (tsCount === 0) throw new Error("No .ts segments found!");

                const timemarks = Array.from({ length: tsCount }, (_, i) =>
                    ((i + 1) * SEGMENT_DURATION).toString()
                );

                // Get original video resolution
                const { width: originalWidth, height: originalHeight } = await getVideoResolution(filePath);
                const thumbnailHeight = Math.round((160 / originalWidth) * originalHeight);

                ffmpeg(filePath)
                    .on('end', async () => {
                        console.log(`📸 ${tsCount} Thumbnails generated!`);

                        // ✅ Ensure proper filename padding after generation
                        const files = fs.readdirSync(thumbnailPath)
                            .filter(file => file.startsWith('thumbnail-'))
                            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

                        files.forEach((file, index) => {
                            const newFileName = `thumbnail-${String(index + 1).padStart(3, '0')}.png`;
                            fs.renameSync(path.join(thumbnailPath, file), path.join(thumbnailPath, newFileName));
                        });

                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('❌ Error generating thumbnails:', err);
                        reject(err);
                    })
                    .screenshots({
                        count: tsCount,  // Ensure exact match
                        folder: thumbnailPath,
                        filename: 'thumbnail-%d.png',  // Basic format (will rename later)
                        size: `160x${thumbnailHeight}`,
                        timemarks: timemarks,
                    });

            } catch (err) {
                reject(err);
            }
        }, 5000); // Delay to ensure segments are generated
    });
};

// Create VTT file for thumbnails
const createVTTFile = (thumbnailPath, vttFilePath) => {
    const files = fs.readdirSync(thumbnailPath)
        .filter(file => file.endsWith('.png'))
    // .sort();

    const vttContent = files.map((file, index) => {
        const timestamp = index * SEGMENT_DURATION;
        return `${String(Math.floor(timestamp / 60)).padStart(2, '0')}:${String(timestamp % 60).padStart(2, '0')}.000 --> ${String(Math.floor((timestamp + SEGMENT_DURATION) / 60)).padStart(2, '0')}:${String((timestamp + SEGMENT_DURATION) % 60).padStart(2, '0')}.000\nthumbnails/${file}`;
    }).join('\n\n');

    fs.writeFileSync(vttFilePath, `WEBVTT\n\n${vttContent}`);
    console.log('📝 VTT file created!');
};

// Main function to process video
const processVideo = async (filePath, onProgress) => {
    try {
        const resolvedPath = path.resolve(filePath);
        const fileName = getFileNameWithoutExtension(resolvedPath);
        const baseOutputPath = path.join('./streams', fileName);

        const { width, height } = await getVideoResolution(resolvedPath);
        const applicableResolutions = [
            // { name: '1080p', width: 1920, height: 1080 },
            // { name: '720p', width: 1280, height: 720 },
            // { name: '480p', width: 854, height: 480 },
            { name: '360p', width: 640, height: 360 },
        ].filter(res => res.width <= width && res.height <= height);

        // if (!applicableResolutions.some(res => res.width === width && res.height === height)) {
        //     applicableResolutions.unshift({ name: `${width}x${height}`, width, height });
        // }

        createDirectories(baseOutputPath);

        // Process resolutions
        await Promise.all(applicableResolutions.map(async (res) => {
            const resolutionPath = path.join(baseOutputPath, res.name);
            createDirectories(resolutionPath);
            await processResolution(resolvedPath, resolutionPath, res, onProgress,applicableResolutions);
        }));

        // Generate thumbnails based on first resolution's .ts files
        const firstResolutionPath = path.join(baseOutputPath, applicableResolutions[0].name);
        const thumbnailPath = path.join(baseOutputPath, 'thumbnails');
        createDirectories(thumbnailPath);
        await generateThumbnails(resolvedPath, thumbnailPath, firstResolutionPath);
        // Generate poster thumbnail
        await generatePosterThumbnail(resolvedPath, baseOutputPath);
        const vttFilePath = path.join(baseOutputPath, 'thumbnails.vtt');
        createVTTFile(thumbnailPath, vttFilePath);

        createMasterM3U8(baseOutputPath, applicableResolutions);

        console.log('✅ All resolutions processed successfully!');
    } catch (err) {
        console.error('❌ Error processing video:', err);
    }
};

export default processVideo;
