#!/bin/bash
echo "=== RENDER BUILD SCRIPT ==="
echo "1. Installing dependencies..."
npm install

echo "2. Building React app..."
npm run build

echo "3. Copying React build files to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/

echo "4. Listing server/public contents..."
ls -la server/public/

echo "5. Checking critical files exist..."
if [ -f "server/public/index.html" ]; then
    echo "✓ index.html exists"
else
    echo "✗ index.html missing!"
fi

if [ -d "server/public/assets" ]; then
    echo "✓ assets folder exists"
    echo "Assets contents:"
    ls -la server/public/assets/
else
    echo "✗ assets folder missing!"
fi

echo "=== BUILD COMPLETE ==="