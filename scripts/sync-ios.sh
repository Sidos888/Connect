#!/bin/bash

# Simple iOS Sync Script
# This automates: build → sync → restart dev server

set -e  # Exit on error

echo "🚀 Starting iOS sync workflow..."

# Step 1: Build Next.js app
echo "📦 Building Next.js app..."
npm run build

# Step 2: Sync with iOS
echo "📱 Syncing with iOS..."
npx cap sync ios

# Step 3: Kill existing dev server (if running)
echo "🔄 Restarting dev server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Step 4: Start dev server in background
echo "✅ Starting dev server on port 3000..."
npm run dev &

echo ""
echo "✨ iOS sync complete!"
echo "📱 Open in Xcode: npx cap open ios"
echo "🌐 Dev server running on http://localhost:3000"

