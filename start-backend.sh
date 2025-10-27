#!/bin/bash

# Script to start the Spring Boot backend

echo "Starting Spring Boot Backend..."

# Check if port 8080 is in use
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 8080 is already in use. Stopping existing process..."
    lsof -ti:8080 | xargs kill -9
    sleep 2
fi

# Navigate to backend directory
cd backend

# Start Spring Boot
mvn spring-boot:run

