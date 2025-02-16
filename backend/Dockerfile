FROM node:alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy application files
COPY . .

# Expose necessary ports
EXPOSE 3000

# Start application
CMD ["node", "index.js"]
