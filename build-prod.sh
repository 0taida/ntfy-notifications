#!/bin/bash
# Production build script for ntfy

VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v2.11.0")
COMMIT=$(git rev-parse --short HEAD)
DATE=$(date -u +%Y-%m-%dT%H:%M:%S)

echo "Building ntfy production binary..."
echo "  Version: $VERSION"
echo "  Commit:  $COMMIT"
echo "  Date:    $DATE"

CGO_ENABLED=1 go build \
  -ldflags="-s -w -X main.version=$VERSION -X main.commit=$COMMIT -X main.date=$DATE" \
  -o ntfy-prod \
  main.go

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    ls -lh ntfy-prod
    echo ""
    echo "Version info:"
    ./ntfy-prod --help | tail -3
    echo ""
    echo "To run: ./ntfy-prod serve --config server/server.yml"
else
    echo "✗ Build failed!"
    exit 1
fi
