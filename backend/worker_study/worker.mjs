import { parentPort, workerData } from "worker_threads";

// Function to calculate sum step by step and send updates
const calculateSum = (n) => {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;

    // Send progress updates every 2 million iterations
    if (i % 2000000 === 0) {
      parentPort.postMessage(`Processed up to ${i}, partial sum: ${sum}`);
    }
  }
  return sum;
};

// Listen for messages from the main thread
parentPort.on("message", (msg) => {
  console.log("Message from Main Thread:", msg);
});

// Start processing and send the final result
const result = calculateSum(workerData);
parentPort.postMessage(`Final Sum up to ${workerData}: ${result}`);
