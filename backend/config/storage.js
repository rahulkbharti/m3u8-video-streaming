import dotenv from 'dotenv';
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import path from "path";

const environment = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${environment}` });

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;

// Initialize Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * Upload a file to Azure Blob Storage
 * @param {string} filePath - Local file path to upload
 */
export const uploadFile = async (filePath) => {
    try {
        const blobName = path.basename(filePath); // Extract filename
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadStream = fs.createReadStream(filePath);

        await blockBlobClient.uploadStream(uploadStream);
        console.log(`✅ File uploaded successfully: ${blobName}`);
    } catch (error) {
        console.error("❌ Error uploading file:", error.message);
    }
};

/**
 * Download a file from Azure Blob Storage
 * @param {string} blobName - Name of the blob to download
 * @param {string} downloadPath - Local path to save the file
 */
export const downloadFile = async (blobName, downloadPath) => {
    try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const downloadedFile = fs.createWriteStream(downloadPath);

        await new Promise((resolve, reject) => {
            downloadBlockBlobResponse.readableStreamBody
                .pipe(downloadedFile)
                .on("finish", resolve)
                .on("error", reject);
        });

        console.log(`✅ File downloaded successfully: ${downloadPath}`);
    } catch (error) {
        console.error("❌ Error downloading file:", error.message);
    }
};

/**
 * List all files in the Azure Blob Storage container
 */
export const listBlobs = async () => {
    console.log("🔹 Listing files in container:");
    for await (const blob of containerClient.listBlobsFlat()) {
        console.log(`- ${blob.name}`);
    }
};

listBlobs()