#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=2048"
while true; do
  echo "Starting Next.js dev server..."
  npx next dev -p 3000 2>&1
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
