#!/usr/bin/env bash
set -euo pipefail

# Root of the repo
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Ensure submodules such as the embed widget are present
if [ -f .gitmodules ]; then
  git submodule update --init --recursive
fi

# Install dependencies using yarn for each package
for dir in server collector frontend embed; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    echo "Installing dependencies for $dir" 
    yarn --cwd "$dir" install --frozen-lockfile
  fi
done

echo "Building Docker image using docker/Dockerfile"
IMAGE_NAME="anythingllm-custom"
docker build -t "$IMAGE_NAME" -f docker/Dockerfile .

echo "Deploying to Railway"
# Ensure your Railway service exposes port 3001
railway up
