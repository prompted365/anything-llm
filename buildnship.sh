#!/usr/bin/env bash
set -euo pipefail

# Root of the repo
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Ensure submodules such as the embed widget are present
if [ -f .gitmodules ]; then
<<<<<<< HEAD
  git submodule update --init --recursive
fi

# Install dependencies using yarn for each package
for dir in server collector frontend embed; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    echo "Installing dependencies for $dir" 
=======
  echo "Initializing git submodules..."
  git submodule update --init --recursive
fi

# Install dependencies using Yarn for each package
for dir in server collector frontend embed; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    echo "Installing dependencies for $dir..."
>>>>>>> 4590dd5c (github)
    yarn --cwd "$dir" install --frozen-lockfile
  fi
done

<<<<<<< HEAD
echo "Building Docker image using docker/Dockerfile"
IMAGE_NAME="anythingllm-custom"
docker build -t "$IMAGE_NAME" -f docker/Dockerfile .

echo "Deploying to Railway"
# Ensure your Railway service exposes port 3001
railway up
=======
# Build the Docker image using docker/Dockerfile
echo "Building Docker image using docker/Dockerfile..."
IMAGE_NAME="anythingllm-custom"
docker build -t "$IMAGE_NAME" -f docker/Dockerfile .

# Deploy to Railway
echo "Deploying to Railway..."
if ! command -v railway &> /dev/null; then
  echo "Error: Railway CLI is not installed. Please install it and try again."
  exit 1
fi

# Ensure Railway exposes port 3001
echo "Ensuring Railway is configured to expose port 3001..."
railway link -p 6de34df3-9697-4fce-9e59-c6566c0cb3d1
railway up

echo "Build and deployment complete!"
>>>>>>> 4590dd5c (github)
