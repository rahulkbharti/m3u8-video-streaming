import fs from 'fs';
import path from 'path';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const environment = process.env.NODE_ENV || 'development';
// Load environment variables
dotenv.config({ path: `.env.${environment}` });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

/**
 * Uploads a directory and its files recursively to Azure Blob Storage.
 * @param {string} localDirPath - Path to the local directory.
 * @param {string} azurePath - Path in Azure Blob Storage.
 */
export const uploadDirectory = async (localDirPath, azurePath = '') => {
    const files = fs.readdirSync(localDirPath);

    for (const file of files) {
        const localFilePath = path.join(localDirPath, file);
        const azureBlobPath = path.join(azurePath, file).replace(/\\/g, '/'); // Normalize path for Azure

        const blockBlobClient = containerClient.getBlockBlobClient(azureBlobPath);

        if (fs.lstatSync(localFilePath).isDirectory()) {
            await uploadDirectory(localFilePath, azureBlobPath); // Recursive call for subdirectories
        } else {
            const fileBuffer = fs.readFileSync(localFilePath);
            await blockBlobClient.uploadData(fileBuffer);
            console.log(`✅ Uploaded: ${azureBlobPath}`);
        }
    }
};

/**
 * Deletes a local directory and its contents.
 * @param {string} dirPath - Path to the local directory.
 */
export const deleteLocalDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;

    fs.readdirSync(dirPath).forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            deleteLocalDirectory(filePath);
        } else {
            fs.unlinkSync(filePath);
        }
    });

    fs.rmdirSync(dirPath);
    console.log(`🗑️ Deleted local directory: ${dirPath}`);
};

/**
 * Deletes an entire directory from Azure Blob Storage.
 * @param {string} azureDir - Directory path in Azure Blob Storage.
 */
export const deleteAzureDirectory = async (azureDir) => {
    let blobs = containerClient.listBlobsFlat({ prefix: azureDir });

    for await (const blob of blobs) {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        await blockBlobClient.delete();
        console.log(`🗑️ Deleted: ${blob.name}`);
    }
};
