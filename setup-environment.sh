#!/bin/bash

# OpenChat Plugin Development Environment Setup

echo "Setting up OpenChat Plugin Development Environment..."

# Install Internet Computer SDK (DFX)
echo "Installing IC SDK..."
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# Add dfx to PATH
export PATH="$HOME/.local/share/dfx/bin:$PATH"

# Verify installation
dfx --version

# Create project directory
mkdir -p openchat-plugin
cd openchat-plugin

# Initialize npm project
npm init -y

# Install core dependencies
echo "Installing dependencies..."
npm install \
  @dfinity/agent \
  @dfinity/candid \
  @dfinity/principal \
  @dfinity/identity \
  @dfinity/auth-client \
  @elizaos/core \
  typescript \
  ts-node \
  @types/node \
  ws \
  uuid \
  dotenv

# Install dev dependencies
npm install -D \
  @types/uuid \
  @types/ws \
  nodemon \
  jest \
  @types/jest

echo "Environment setup complete!"
echo "Next: Create plugin structure"