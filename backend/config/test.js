import dotenv from 'dotenv';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';

const environment = process.env.NODE_ENV || 'development';
// Load environment variables
dotenv.config({ path: `.env.${environment}` });
// console.log(process.env)

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;


const localFilePath = "./config/test.js"; // Replace with your file path
const blobName = path.basename(localFilePath); // Use the local file name as the blob name

async function uploadLocalFile() {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const stream = fs.createReadStream(localFilePath);
    const uploadBlobResponse = await blockBlobClient.uploadStream(stream);

    console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

uploadLocalFile();