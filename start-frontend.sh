#!/bin/bash

# Script to start the Angular frontend

echo "Starting Angular Frontend..."

# Check if port 4200 is in use
if lsof -Pi :4200 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 4200 is already in use. Stopping existing process..."
    lsof -ti:4200 | xargs kill -9
    sleep 2
fi

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start Angular dev server
ng serve

