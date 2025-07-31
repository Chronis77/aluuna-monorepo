#!/bin/bash

echo "🚀 Starting Aluuna TTS Server..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if google-creds.json exists
if [ ! -f "google-creds.json" ]; then
    echo "❌ google-creds.json not found. Please ensure your Google Cloud credentials file is in the project root."
    exit 1
fi

# Build and start the containers
echo "📦 Building and starting containers..."
docker-compose up -d --build

# Wait for the server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if the server is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Aluuna TTS Server is running!"
    echo "📡 Health check: http://localhost:3000/health"
    echo "🎵 TTS endpoint: http://localhost:3000/tts"
    echo "🔊 SSML endpoint: http://localhost:3000/tts/ssml"
    echo ""
    echo "🧪 To test the server, run: node test-api.js"
    echo "📋 To view logs, run: docker-compose logs -f aluuna-tts"
    echo "🛑 To stop the server, run: docker-compose down"
else
    echo "❌ Server failed to start. Check logs with: docker-compose logs aluuna-tts"
    exit 1
fi 