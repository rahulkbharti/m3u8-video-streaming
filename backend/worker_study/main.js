import { Worker } from "worker_threads";

const runWorkerTask = (num) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.mjs", import.meta.url), {
      workerData: num,
    });

    worker.on("message", (msg) => {
      console.log("Received from Worker:", msg);

      // If the worker has completed the task, terminate it
      if (msg.startsWith("Final Sum")) {
        worker.terminate();
      }
    });

    worker.on("error", (err) => {
      console.error("Worker Error:", err);
      reject(err);
    });

    worker.on("exit", (code) => {
      console.log(`Worker exited with code ${code}`);
      resolve(`Worker finished with code ${code}`);
    });

    // Send a message to the worker after 1 second
    setTimeout(() => {
      worker.postMessage("Hello Worker, keep going!");
    }, 1000);
  });
};

// Example Usage
runWorkerTask(10000000)
  .then((result) => console.log(result))
  .catch((err) => console.error("Error:", err));
