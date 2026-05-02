#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=2048"

# Start the server in background
npx next dev -p 3000 -H 0.0.0.0 &
SERVER_PID=$!

# Wait for it to start
sleep 5

# Keep it alive with periodic health checks
while kill -0 $SERVER_PID 2>/dev/null; do
  sleep 10
  # Make a lightweight request to keep the process active
  curl -s http://127.0.0.1:3000/api/auth/me -m 5 > /dev/null 2>&1 || true
done

echo "Server process died"
