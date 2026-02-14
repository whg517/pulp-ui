#!/bin/bash

# Pulp UI Docker Development Setup
# This script starts the Pulp backend services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Pulp backend services..."
echo "This may take a few minutes for the first run."

# Navigate to docker directory
cd "$SCRIPT_DIR"

# Start services
docker-compose up -d

echo ""
echo "Waiting for Pulp API to be ready..."
echo "This can take up to 2 minutes on first start..."

# Wait for Pulp to be ready
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f http://localhost:8080/pulp/api/v3/status/ > /dev/null 2>&1; then
        echo ""
        echo "Pulp is ready!"
        echo ""
        echo "API URL: http://localhost:8080/pulp/api/v3/"
        echo "Username: admin"
        echo "Password: admin"
        echo ""
        echo "To stop the services, run: cd docker && docker-compose down"
        exit 0
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for Pulp... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

echo ""
echo "Warning: Pulp did not become ready within the expected time."
echo "Check the logs with: cd docker && docker-compose logs pulp"
exit 1
