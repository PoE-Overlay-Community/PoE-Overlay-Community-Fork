# Dockerfile for Linux build automation.
# 
# Run with 'DOCKER_BUILDKIT=1 docker build -o release .' from the repo root.
# 
# Demonstrates developing PoE-Overlay on Linux and produces testable Linux
# builds. Each step will be cached independently, so subsequent builds will be
# faster. First build will take up to 10 minutes.
# IMPORTANT: Set DOCKER_BUILDKIT=1 in your environment variables or you will not
# get any build artifacts in your release folder.
ARG codedir=/opt/PoE-Overlay-Community-Fork

# Since the Electron builder targets Debian packaging, start with an Ubuntu LTS image.
FROM ubuntu:20.04 AS build-stage

# Install build environment dependencies.
RUN apt-get update
RUN apt-get install -y libx11-dev libxtst-dev libpng-dev wget make g++ git lsb-release gnupg
# https://github.com/nodesource/distributions/blob/0d3d988/README.md#installation-instructions
RUN wget https://deb.nodesource.com/setup_12.x -O nodesource.sh
RUN bash nodesource.sh
RUN apt-get install -y nodejs

# Set up working directory.
ARG codedir
RUN mkdir $codedir
WORKDIR $codedir

# Copy the code into the container, avoiding .git and node_modules.
COPY *.json $codedir/
COPY browserslist $codedir
COPY dev-app-update.yml $codedir
COPY main.ts $codedir
COPY overlay.babel #codedir
COPY electron $codedir/electron
COPY img $codedir/img
COPY src $codedir/src

# Since 0.7.11 npm default memory restriction is too small to build the overlay
ENV NODE_OPTIONS=--max_old_space_size=4096
# Install NodeJS dependencies/modules.
RUN npm install

# Build the app.
# If you get an out of memory error, increase Docker's resources.
RUN mkdir -p $codedir/release
RUN npm run electron:linux

# Export the build from the container to the 'release' folder on your PC.
FROM scratch as export-stage
ARG codedir
COPY --from=build-stage $codedir/release/ /
