#!/bin/bash

set -e

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
APP_NAME="atpl-backend-api"
APP_PORT=1162
BRANCH="main"
APP_DIR="/home/ubuntu/work/atpl-backend"
BACKEND_REPO_URL="https://github.com/IshankDev/atpl-backend-code.git"
REMOTE_NAME="origin"

echo "🚀 Starting backend deployment..."

cd "$APP_DIR"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
  git remote add "$REMOTE_NAME" "$BACKEND_REPO_URL"
  echo "   Cloning repository for the first time..."
  git fetch "$REMOTE_NAME"
  git checkout -b "$BRANCH" "$REMOTE_NAME/$BRANCH" 2>/dev/null || git checkout "$BRANCH"
fi

# Ensure remote is set to backend repository
CURRENT_URL=$(git remote get-url "$REMOTE_NAME" 2>/dev/null || echo "")
if [ "$CURRENT_URL" != "$BACKEND_REPO_URL" ]; then
  echo "🔄 Setting remote to backend repository..."
  if [ -n "$CURRENT_URL" ]; then
    git remote set-url "$REMOTE_NAME" "$BACKEND_REPO_URL"
  else
    git remote add "$REMOTE_NAME" "$BACKEND_REPO_URL"
  fi
fi

echo "📥 Pulling latest code from $REMOTE_NAME/$BRANCH"

# Fetch latest changes from remote
git fetch "$REMOTE_NAME"

# Check if branch exists locally, if not checkout from remote
if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  echo "   Branch $BRANCH doesn't exist locally, checking out from remote..."
  git checkout -b "$BRANCH" "$REMOTE_NAME/$BRANCH"
else
  # Switch to the branch if not already on it
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "$REMOTE_NAME/$BRANCH"
  fi
fi

# Pull latest changes (preserves local files like .env)
# Temporarily disable exit on error for pull (in case of conflicts)
set +e
git pull "$REMOTE_NAME" "$BRANCH"
PULL_EXIT_CODE=$?
set -e

if [ $PULL_EXIT_CODE -ne 0 ]; then
  echo "⚠️  Pull had conflicts or failed, but continuing with current code..."
  echo "   Your local files (like .env) are preserved"
fi

echo "📦 Installing dependencies"
npm install

echo "🏗️ Building backend"
npm run build

echo "♻️ Restarting PM2 process"

if pm2 list | grep -q "$APP_NAME"; then
  pm2 restart "$APP_NAME"
else
  pm2 start dist/main.js --name "$APP_NAME" --env production
fi

pm2 save

echo "🔍 Verifying backend is listening on port $APP_PORT"
sleep 2
ss -lntp | grep ":$APP_PORT" || echo "⚠️ Warning: Port $APP_PORT not detected yet"

echo "✅ Deployment completed successfully"
