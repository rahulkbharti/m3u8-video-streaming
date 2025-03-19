import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Azure Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

const blockBlobClient = containerClient.getBlockBlobClient(blobName);

// OPTION 1: Generate a PUBLIC URL if your container allows public access
const publicUrl = blockBlobClient.url;
console.log(res.redirect(publicUrl)); // Redirect to Azure URL

const videoId = "sample";
try {
    // const { videoId } = req.params;
    const blobName = `videos/${videoId}/master.m3u8`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Check if the file exists
    if (!(await blockBlobClient.exists())) {
        return res.status(404).json({ error: "File not found" });
    }

    // Get the file as a stream
    const downloadResponse = await blockBlobClient.download();
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl"); // Set correct MIME type for m3u8
    downloadResponse.readableStreamBody.pipe(res); // Pipe directly to response

} catch (error) {
    console.error("❌ Error serving master.m3u8:", error);
    res.status(500).json({ error: "Internal Server Error" });
}