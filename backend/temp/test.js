import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Fix for ES6: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to process video into HLS (.ts) + Thumbnails (Separate Paths)
const processVideo = async (inputFile, resolution, SEGMENT_DURATION = 10) => {
    console.log(`🚀 Processing video: ${inputFile} at resolution ${resolution.name}`);

    // Define separate output directories
    const streamFolder = path.join(__dirname, 'output', resolution.name, 'streams');
    const thumbnailFolder = path.join(__dirname, 'output', resolution.name, 'thumbnails');
    fs.mkdirSync(streamFolder, { recursive: true });
    fs.mkdirSync(thumbnailFolder, { recursive: true });

    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            // Set output resolution
            .size(`${resolution.width}x${resolution.height}`)
            .videoCodec('libx264')

            // Generate HLS segments (.ts) & playlist (.m3u8)
            .outputOptions([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                `-hls_time ${SEGMENT_DURATION}`, // Segment duration
                '-hls_list_size 0', // No limit on .ts files in playlist
                '-f hls', // Format: HLS
                `-hls_segment_filename ${path.join(streamFolder, 'segment_%03d.ts')}`
            ])
            .output(path.join(streamFolder, 'playlist.m3u8'))  

            .on('progress', (progress) => console.log(`⏳ Progress: ${progress.percent}%`))
            .on('end', () => {
                console.log(`✅ HLS Processing Completed: ${resolution.name}`);

                // Step 2: Generate Thumbnails Every 10 Seconds
                ffmpeg(inputFile)
                    .outputOptions([
                        '-vf', `fps=1/${SEGMENT_DURATION},scale=320:180`, // Extract 1 frame per segment
                        '-vsync', 'vfr'
                    ])
                    .output(path.join(thumbnailFolder, 'thumbnail_%03d.jpg'))
                    .on('end', () => {
                        console.log(`✅ Thumbnails Completed: ${resolution.name}`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`❌ Error generating thumbnails:`, err);
                        reject(err);
                    })
                    .run();
            })
            .on('error', (err) => {
                console.error(`❌ Error processing ${resolution.name}:`, err);
                reject(err);
            })
            .run();
    });
};

// Run the function (Test Case)
const testProcess = async () => {
    try {
        await processVideo(
            path.join(__dirname, 'video.mp4'), 
            { name: '360p', width: 640, height: 360 }
        );
        console.log('🎉 Video processing test completed!');
    } catch (error) {
        console.error('❌ Error in processing:', error);
    }
};

// Execute the test
testProcess();
