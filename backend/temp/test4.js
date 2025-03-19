import { uploadDirectory, deleteLocalDirectory, deleteAzureDirectory } from './azureUploader.js';
import path from 'path';

const videoId = 'video'; // Replace with actual video ID
const localVideoPath = path.join(process.cwd(), 'streams', videoId); // Your video folder

// **Upload and then delete locally**
uploadDirectory(localVideoPath, `videos/${videoId}`)
    .then(() => {
        console.log('🚀 All files uploaded successfully!');
        deleteLocalDirectory(localVideoPath);
    })
    .catch((err) => console.error('❌ Upload failed:', err));

// **Delete from Azure when needed**
// deleteAzureDirectory(`videos/${videoId}`);
