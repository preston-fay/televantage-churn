#!/usr/bin/env bash
set -euo pipefail
TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "Usage: $0 <tag-name>"
  echo "Example: $0 v2025.10.28-ai-demo-stable"
  exit 1
fi
echo "🔄 Restoring to tag: $TAG"
git fetch --tags --all
git checkout "$TAG"
if [ -f package.json ]; then
  echo "📦 Installing dependencies..."
  npm ci || npm i
  echo "🚀 Starting dev server..."
  npm run dev || npm start || echo "Dev server command not found."
else
  echo "No package.json found; nothing to run."
fi
