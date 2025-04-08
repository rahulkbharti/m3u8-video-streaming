# m3u8-video-streaming

This project is a video streaming application that uses the M3U8 format for streaming video content. It includes both backend and frontend components to handle video uploads, processing, and streaming.

## Live Demo

Check out the live demo of the application [here](https://rahulkbharti.github.io/m3u8-video-streaming/).
### Output :
![alt text](output.png)

### Upload Video:
![alt text](upload.png)

## 🚀 Key Features – HLS Video Streaming Platform

### ✅ Core Functionalities

- **🎬 Video Uploads**  
  Users can upload videos via a responsive frontend interface.

- **⚙️ Video Processing**  
  Backend processes uploaded videos into multiple resolutions (240p–1080p) using **FFmpeg** for adaptive bitrate streaming.

- **📃 M3U8 Playlist Generation**  
  Automatically generates `.m3u8` playlists and `.ts` segments for smooth HLS streaming.

- **📺 HLS Video Streaming**  
  Fully supports secure streaming using dynamically rewritten playlists with **signed segment URLs**.

- **🧠 Worker-based FFmpeg Processing**  
  FFmpeg runs in a **separate Node.js worker process**, ensuring the main server thread is never blocked during heavy video operations.

- **🗃️ MongoDB Integration**  
  Stores video metadata like title, description, upload time, likes, and resolution formats.

---

### 🔐 Security & Optimization

- **🔑 Azure Blob Signed URLs**  
  All media files (playlists, segments, thumbnails) are served via **short-lived signed URLs** with caching for reuse before expiration.

- **🛡️ AES-128 Encrypted Segments (Planned)**  
  Supports encrypted HLS segments with signed key delivery (future-ready for DRM-like control).

- **📡 Real-time Status with Socket.io**  
  Users uploading videos get **real-time updates** (progress, success, or failure) via websockets.

---

### 🧰 DevOps & Deployment

- **🐳 Docker Support**  
  Easily containerized and deployable using Docker.

- **⚙️ GitHub Actions CI/CD**  
  Automated workflows for build, test, and deploy stages using GitHub Actions.

- **🚀 Cloud Deployment on Render**  
  The platform is deployed on **Render.com** using Docker containers. Future-ready for **Kubernetes-based scaling**.

---

### 🌐 Tech Stack

- **Node.js** – REST API & video processing logic  
- **MongoDB** – Metadata storage  
- **FFmpeg** – Video transcoding & thumbnail generation  
- **Azure Blob Storage** – Secure storage of video files  
- **Socket.io** – Real-time upload and process tracking  
- **Docker** – Containerization  
- **GitHub Actions** – CI/CD Pipelines  
- **Render** – Cloud deployment


### Environment Secrets and Variables
make sure You have added these Secrets and Variables in your projects.
```sh
MONGODB_URI="Your_Database_URI"
MONGODB_DB_NAME="Your_Database_name"

DOCKER_USERNAME="Your_Docker_USERNAME"
DOCKER_PASSWORD="Your_Docker_Tocken"

RENDER_API_KEY="Your_Render_API_KEY"
RENDER_SERVICE_ID="Your_Render_Service_ID"

AZURE_STORAGE_CONNECTION_STRING="Youre_Azure_connection_string"
AZURE_CONTAINER_NAME="Azure_container_Name"
```



## License

This project is licensed under the MIT License.
