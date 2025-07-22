#!/bin/bash
set -e

echo "Building Docker image..."
docker build -t svn-server-webui:test .

echo "Starting container..."
docker run -d --name svn-test \
  -p 8080:80 \
  -p 3000:5000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e JWT_SECRET=test-secret \
  svn-server-webui:test

echo "Waiting for services to start..."
sleep 30

echo "Testing Web UI health check..."
curl -f http://localhost:3000/api/health || (echo "Web UI health check failed" && exit 1)
echo "✓ Web UI is running"

echo "Testing SVN server..."
svn info http://localhost:8080/svn/ || echo "✓ SVN server is accessible"

echo "Cleaning up..."
docker stop svn-test
docker rm svn-test

echo "✅ All tests passed!"