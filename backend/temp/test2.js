import processVideo from "./generate-res.mjs";

import { deleteAzureDirectory } from "./azureUploader.js";

processVideo('./sample.mp4', (resolution, percent) => {
    console.log(`Progress: ${percent}%`);
}
).then(() => {
    console.log('✅ Video processing completed!');
}).catch((err) => {
    console.error('❌ Error processing video:', err);
});

// deleteAzureDirectory('streams');