#!/bin/bash
cd "$(dirname "$0")"
echo "Building..."
npm run build
echo ""
echo "Starting server at http://localhost:3005"
echo "Press Ctrl+C to stop"
npm start
