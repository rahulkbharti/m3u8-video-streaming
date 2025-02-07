import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Function to determine the video resolution
const getVideoResolution = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                return reject(err);
            }
            const { width, height } = metadata.streams[0];
            resolve({ width, height });
        });
    });
};

// Function to get the base file name without extension
const getFileNameWithoutExtension = (filePath) => {
    const fileName = path.basename(filePath);
    return fileName.substring(0, fileName.lastIndexOf('.'));
};

// Function to create directories if they do not exist
const createDirectories = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Function to process each resolution sequentially with progress callback
const processResolution = (filePath, resolutionPath, resolution, onProgress) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath, { timeout: 432000 })
            .videoCodec('libx264')
            .size(`${resolution.width}x${resolution.height}`)
            .addOption([
                '-profile:v baseline',
                '-level 3.0',
                '-start_number 0',
                `-hls_segment_filename ${path.join(resolutionPath, 'segment%03d.ts')}`,
                '-hls_time 6',
                '-hls_list_size 0',
                '-f hls',
            ])
            .output(path.join(resolutionPath, `playlist-${resolution.name}.m3u8`))
            .on('end', () => {
                console.log(`Transcoding succeeded for ${resolution.name}!`);
                resolve();
            })
            .on('start', (commandLine) => {
                console.log('start', commandLine);
            })
            .on('codecData', (data) => {
                console.log('Input is ' + data.audio + ' audio ' +
                    'with ' + data.video + ' video');
            })
            .on('progress', (progress) => {
                if (onProgress) {
                    onProgress(resolution.name, progress.percent);
                }
                console.log(`Processing ${resolution.name}. Timemark: -> ` + progress.timemark);
            })
            .on('stderr', (stderrLine) => {
                // do nothing
            })
            .on('error', (err, stdout, stderr) => {
                console.log('Cannot process video: ' + err.message);
                reject(err);
            })
            .on('data', (chunk) => {
                console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
            })
            .run();
    });
};

// Function to create a master M3U8 file
const createMasterM3U8 = (baseOutputPath, resolutions) => {
    const masterM3U8Path = path.join(baseOutputPath, 'master.m3u8');
    const bandwidths = {
        '1080p': 2000000,
        '720p': 1500000,
        '480p': 1000000,
        '360p': 600000
    };
    const masterM3U8Content = resolutions.map(resolution => {
        const resolutionPath = path.join(resolution.name, `playlist-${resolution.name}.m3u8`);
        const bandwidth = bandwidths[`${resolution.name}`];
        return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution.width}x${resolution.height}
${resolutionPath}`;
    }).join('\n');

    fs.writeFileSync(masterM3U8Path, `#EXTM3U\n${masterM3U8Content}`);
    console.log('Master M3U8 file created successfully!');
};

// Main function to process video resolutions
const processVideo = async (filePath, onProgress) => {
    try {
        const resolvedPath = path.resolve(filePath);
        const fileName = getFileNameWithoutExtension(resolvedPath);
        const baseOutputPath = path.join('./streams', fileName);

        const originalResolution = await getVideoResolution(resolvedPath);

        // Make sure original resolution is added uniquely
        const originalRes = { name: `${originalResolution.width}x${originalResolution.height}`, width: originalResolution.width, height: originalResolution.height };
        const applicableResolutions = [
            { name: '1080p', width: 1920, height: 1080 },
            { name: '720p', width: 1280, height: 720 },
            { name: '480p', width: 854, height: 480 },
            { name: '360p', width: 640, height: 360 },
        ].filter(res =>
            res.width <= originalResolution.width && res.height <= originalResolution.height);

        // Adding original resolution if it's not already in the list
        if (!applicableResolutions.some(res => res.width === originalRes.width || res.height === originalRes.height)) {
            applicableResolutions.unshift(originalRes);
        }

        // Create base directories
        createDirectories(baseOutputPath);

        for (const resolution of applicableResolutions) {
            const resolutionPath = path.join(baseOutputPath, resolution.name);
            createDirectories(resolutionPath);

            try {
                await processResolution(resolvedPath, resolutionPath, resolution, onProgress);
            } catch (err) {
                console.error(`Error processing resolution ${resolution.name}:`, err);
            }
        }

        // Create the master M3U8 file
        createMasterM3U8(baseOutputPath, applicableResolutions);

        console.log('All resolutions processed successfully!');
    } catch (err) {
        console.error('Error determining video resolution:', err);
    }
};

// Export the processVideo function
export default processVideo;
