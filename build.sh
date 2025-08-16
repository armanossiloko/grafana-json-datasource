#!/bin/bash

echo "Building Grafana JSON Datasource Plugin..."
echo "Installing dependencies..."

yarn install

echo "Building plugin..."
yarn build

if [ ! -d "dist" ]; then
    echo "Error: dist directory not found. Build failed."
    exit 1
fi

echo "Plugin built successfully!"