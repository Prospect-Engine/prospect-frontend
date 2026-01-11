#!/bin/bash

# Start script for different environments
set -e

echo "Starting application in $NODE_CONFIG_ENV environment..."

case "$NODE_CONFIG_ENV" in
  "dev")
    echo "Starting development server with hot reload..."
    yarn dev --turbopack
    ;;
  "stage")
    echo "Starting staging server..."
    yarn start
    ;;
  "production")
    echo "Starting production server..."
    yarn start
    ;;
  *)
    echo "Unknown environment: $NODE_CONFIG_ENV"
    echo "Starting with default production mode..."
    yarn start
    ;;
esac
