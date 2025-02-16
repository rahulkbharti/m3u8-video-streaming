# m3u8-video-streaming

## Running with Docker

To run the project using Docker, use the following command:

```sh
# Build the Docker image
docker build -t m3u8-video-stream .

# Run the Docker container
docker run -d -p 3000:3000 --name streaming-app m3u8-video-stream
```

## Deploying on Render

To deploy this project on Render, follow these steps:

1. Create a new Web Service on Render.
2. Connect your repository.
3. Set the following environment variables in the Render dashboard:

   - `ENV_VAR_1`: value1
   - `ENV_VAR_2`: value2

4. Use the following build and start commands:

   **Build Command:**

   ```sh
   docker build -t m3u8-video-stream .
   ```

   **Start Command:**

   ```sh
   docker run -d -p 3000:3000 --name streaming-app m3u8-video-stream
   ```

5. Deploy the service and wait for it to go live.
