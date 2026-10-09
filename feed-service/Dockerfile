# Node 24 runs the TypeScript source directly, so there is no build step.
FROM node:24-trixie-slim

# ffmpeg: video and audio processing
# libheif-examples: provides heif-dec, used to decode iPhone HEIC photos
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libheif-examples \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Run as the unprivileged "node" user that ships with the image.
USER node

EXPOSE 8080 8081
CMD ["node", "--disable-warning=ExperimentalWarning", "src/main.ts"]
