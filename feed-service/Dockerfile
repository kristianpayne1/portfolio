# Node 24 runs the TypeScript source directly, so there is no build step.
FROM node:24-trixie-slim

# Links the published image to its GitHub repo.
LABEL org.opencontainers.image.source=https://github.com/kristianpayne1/portfolio

# ffmpeg: video and audio processing
# libheif-examples: provides heif-dec, used to decode iPhone HEIC photos
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libheif-examples \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# The commit this image was built from (set by the GitHub workflow), shown by
# GET /health so you can check which version is running. "dev" for local builds.
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA

# Run as the unprivileged "node" user that ships with the image.
USER node

EXPOSE 8080 8081
CMD ["node", "--disable-warning=ExperimentalWarning", "src/main.ts"]
