#!/bin/bash

# OpenChat Plugin Development Setup Script

echo "🛠️  Setting up OpenChat Plugin for local development..."

# 1. Install Internet Computer SDK (DFX)
echo "📦 Installing Internet Computer SDK..."
if ! command -v dfx &> /dev/null; then
    sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
    export PATH="$HOME/.local/share/dfx/bin:$PATH"
    echo "✅ DFX installed"
else
    echo "✅ DFX already installed"
fi

# 2. Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# 3. Build the plugin
echo "🔨 Building the plugin..."
npm run build

# 4. Set up development environment
echo "⚙️  Setting up development environment..."
cp .env.example .env.development
echo "✅ Created .env.development file"

# 5. Create local test configuration
cat > test-config.json << EOF
{
  "canisterId": "rdmx6-jaaaa-aaaah-qacaa-cai",
  "host": "http://127.0.0.1:8000",
  "identity": "./dev-identity.json",
  "polling": {
    "enabled": false,
    "interval": 2000
  },
  "features": {
    "enableDirectMessages": true,
    "enableGroupChats": false,
    "enableCommunities": false,
    "enableCrypto": false
  }
}
EOF
echo "✅ Created test configuration"

# 6. Start local IC replica (optional)
echo "🌐 Starting local Internet Computer replica..."
dfx start --background --clean

# 7. Create test identity
echo "🔑 Creating test identity..."
dfx identity new test-agent --storage-mode=plaintext || true
dfx identity use test-agent
echo "✅ Test identity created"

echo ""
echo "🎉 Development setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.development with your settings"
echo "2. Run tests: npm test"
echo "3. Start development: npm run dev"
echo "4. Test plugin: npm run test:plugin"
echo ""