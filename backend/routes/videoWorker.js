import { parentPort, workerData } from 'worker_threads';
import processVideo from '../generate-res.mjs';

const { filePath } = workerData;

async function process() {
    try {
        await processVideo(filePath, (resolution, percent, applicableResolutions) => {
            parentPort.postMessage({ resolution, percent, applicableResolutions:JSON.stringify(applicableResolutions) });
            console.log(`Processing ${resolution}: ${percent}% complete (${JSON.stringify(applicableResolutions)})`);
        });
        parentPort.postMessage({ status: 'completed' });
    } catch (error) {
        parentPort.postMessage({ status: 'error', error: error.message });
    }
}

process();
