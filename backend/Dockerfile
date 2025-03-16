FROM node:alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg
WORKDIR /app

RUN mkdir -p streams uploads

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["node", "index.js"]
