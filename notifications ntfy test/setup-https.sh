#!/bin/bash

echo "Setting up HTTPS for local development..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed. Installing..."
    
    # Check OS and install mkcert
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mkcert
        else
            echo "Homebrew not found. Please install Homebrew first:"
            echo "https://brew.sh/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y mkcert
        elif command -v yum &> /dev/null; then
            sudo yum install -y mkcert
        else
            echo "Please install mkcert manually:"
            echo "https://github.com/FiloSottile/mkcert#installation"
            exit 1
        fi
    else
        echo "Unsupported OS. Please install mkcert manually:"
        echo "https://github.com/FiloSottile/mkcert#installation"
        exit 1
    fi
fi

# Install local CA
echo "Installing local CA..."
mkcert -install

# Generate certificates for localhost
echo "Generating SSL certificates for localhost..."
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1

echo ""
echo "✅ SSL certificates generated successfully!"
echo ""
echo "To start the HTTPS server, run:"
echo "  node server.js"
echo ""
echo "Then visit:"
echo "  https://localhost:3000/webpush.html"
echo ""
echo "Note: You may see a security warning in your browser."
echo "Click 'Advanced' and 'Proceed to localhost' to continue." 