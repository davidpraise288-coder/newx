# OpenChat Plugin Development Guide

This guide shows you how to run, test, and develop the OpenChat plugin locally before publishing.

## 🚀 **Quick Start (Local Development)**

### **1. One-Command Setup**
```bash
# Clone/navigate to plugin directory
cd openchat-plugin

# Run automated setup
npm run setup:dev
```

This will:
- ✅ Install Internet Computer SDK (DFX)
- ✅ Install Node.js dependencies
- ✅ Build the plugin
- ✅ Create development environment files
- ✅ Start local IC replica
- ✅ Create test identity

### **2. Test the Plugin Structure**
```bash
# Test plugin without OpenChat connection
npm run test:plugin
```

**Expected Output:**
```
🧪 Testing OpenChat Plugin Locally
==================================

✅ Configuration valid
✅ Plugin structure valid
✅ Agent runtime created
⚠️  Plugin initialization failed (expected without real canister)
✅ Send message action validation: true
✅ Join group action validation: true
✅ Evaluator validation: true
🎉 Local Plugin Testing Complete!
```

### **3. Run with Mock OpenChat**
```bash
# Test full functionality with mock service
npm run test:mock
```

**Expected Output:**
```
🎭 Running OpenChat Plugin with Mock Service
============================================

✅ Agent runtime created
🔧 Initializing Mock OpenChat Service...
✅ Mock service initialized
📤 Testing send message action...
📨 Mock: Received incoming message
🤖 Agent would process this message and respond...
🎉 Mock Testing Complete!
```

## 🧪 **Testing Options**

### **Option 1: Structure Testing**
```bash
npm run test:plugin
```
- Tests plugin architecture
- Validates configuration
- Checks action/evaluator logic
- **No OpenChat connection needed**

### **Option 2: Mock Testing**
```bash
npm run test:mock
```
- Full functionality simulation
- Mock message sending/receiving
- Interactive agent behavior
- **Demonstrates real-world usage**

### **Option 3: Unit Testing**
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### **Option 4: Example Scripts**
```bash
npm run example:basic      # Basic usage example
npm run example:advanced   # Advanced features
npm run example:interactive # Interactive agent setup
```

## 🛠️ **Development Workflow**

### **1. Make Changes to Plugin**
```bash
# Edit source files in src/
vim src/actions/send-message.ts

# Build changes
npm run build

# Test changes
npm run test:plugin
```

### **2. Test with ElizaOS Agent**
```bash
# Create a test agent
cat > test-agent.ts << 'EOF'
import { AgentRuntime } from '@elizaos/core';
import { openChatPlugin, createOpenChatConfig } from './src/index.js';

async function createTestAgent() {
  const config = createOpenChatConfig({
    canisterId: 'test-canister-id',
    enablePolling: false,
  });

  const runtime = new AgentRuntime({
    databaseAdapter: null,
    token: 'test-token',
    plugins: [openChatPlugin],
    character: {
      name: 'Test Agent',
      bio: 'Testing OpenChat plugin',
      // ... character config
    },
  });

  console.log('Agent created with OpenChat plugin!');
  return runtime;
}

createTestAgent().catch(console.error);
EOF

# Run test agent
ts-node test-agent.ts
```

### **3. Debug Plugin Issues**
```bash
# Enable debug mode
export OPENCHAT_DEBUG=true
export OPENCHAT_LOG_LEVEL=debug

# Run with debugging
npm run test:mock
```

## 🔧 **Local IC Replica Setup**

### **Start Local Replica**
```bash
# Start clean local IC
dfx start --clean --background

# Check status
dfx ping

# Stop when done
dfx stop
```

### **Deploy Test Canister (Optional)**
```bash
# Create a simple test canister
echo 'service : {}' > test-canister.did

# Deploy it
dfx deploy test-canister

# Get canister ID
dfx canister id test-canister
```

## 📝 **Development Scripts Reference**

| Script | Purpose | Connection Required |
|--------|---------|-------------------|
| `npm run test:plugin` | Test plugin structure | ❌ No |
| `npm run test:mock` | Test with mock service | ❌ No |
| `npm test` | Unit tests | ❌ No |
| `npm run example:basic` | Basic usage demo | ❌ No |
| `npm run example:advanced` | Advanced features | ❌ No |
| `npm run example:interactive` | Interactive agent | ⚠️ Mock only |

## 🎯 **Testing Different Scenarios**

### **Test Action Validation**
```typescript
// test-actions.ts
import { openChatPlugin } from './src/index.js';

const sendAction = openChatPlugin.actions.find(a => a.name === 'SEND_OPENCHAT_MESSAGE');

// Test various message formats
const testMessages = [
  'send message to rdmx6-jaaaa-aaaah-qacaa-cai saying "hello"',
  'openchat send "test" to be2us-64aaa-aaaah-qaabq-cai',
  'message rdmx6-jaaaa-aaaah-qacaa-cai: "test message"',
];

for (const text of testMessages) {
  const isValid = await sendAction.validate(runtime, { content: { text } });
  console.log(`"${text}" -> ${isValid}`);
}
```

### **Test Evaluator Logic**
```typescript
// test-evaluator.ts
import { openChatPlugin } from './src/index.js';

const evaluator = openChatPlugin.evaluators[0];

const testMessages = [
  { text: 'Hello from OpenChat', source: 'openchat' },
  { text: 'Regular message', source: 'discord' },
  { text: 'OpenChat message', source: 'telegram' },
];

for (const content of testMessages) {
  const isValid = await evaluator.validate(runtime, { content });
  console.log(`${JSON.stringify(content)} -> ${isValid}`);
}
```

## 🐛 **Common Development Issues**

### **Issue: "DFX not found"**
```bash
# Install IC SDK
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
export PATH="$HOME/.local/share/dfx/bin:$PATH"
```

### **Issue: "TypeScript errors"**
```bash
# Check types
npm run type-check

# Fix formatting
npm run format

# Fix linting
npm run lint:fix
```

### **Issue: "Tests failing"**
```bash
# Run tests in isolation
npm test -- --runInBand

# Clear Jest cache
npx jest --clearCache

# Run specific test
npm test -- actions.test.ts
```

### **Issue: "Plugin not loading"**
```bash
# Check plugin structure
node -e "console.log(require('./dist/index.js').openChatPlugin)"

# Verify build
npm run build
ls -la dist/
```

## 📦 **Preparing for Publication**

### **1. Final Testing**
```bash
# Run all tests
npm test
npm run test:plugin
npm run test:mock

# Check build
npm run build
npm run type-check

# Test examples
npm run example:basic
```

### **2. Version and Package**
```bash
# Update version
npm version patch  # or minor/major

# Create package
npm pack

# Test installation
npm install elizaos-plugin-openchat-1.0.0.tgz
```

### **3. Publish to NPM**
```bash
# Login to NPM
npm login

# Publish
npm publish
```

## 🔄 **Integration with Existing Agent**

### **Add to Existing ElizaOS Agent**
```typescript
// In your existing agent code
import { openChatPlugin, createOpenChatConfig } from '@elizaos/plugin-openchat';

// Add to your agent's plugins array
const runtime = new AgentRuntime({
  // ... existing config
  plugins: [
    ...existingPlugins,
    openChatPlugin,  // Add OpenChat plugin
  ],
});

// Configure OpenChat
const openChatConfig = createOpenChatConfig({
  canisterId: 'your-canister-id',
  // ... config options
});

await initializeOpenChatPlugin(runtime, openChatConfig);
```

### **Test Integration**
```bash
# Run your existing agent with OpenChat plugin
node your-agent.js

# Should see in logs:
# "OpenChat plugin initialized successfully"
# "Agent Principal: rdmx6-jaaaa-aaaah-qacaa-cai"
```

## 🎉 **Success Indicators**

You know the plugin is working when:

✅ **Structure tests pass**: `npm run test:plugin` succeeds  
✅ **Mock tests work**: `npm run test:mock` shows message flow  
✅ **Actions validate**: Commands are recognized correctly  
✅ **Evaluators respond**: Messages are evaluated properly  
✅ **No TypeScript errors**: `npm run type-check` is clean  
✅ **Examples run**: All example scripts execute without errors  

## 🚀 **Ready for OpenChat Integration**

Once you have:
- ✅ All tests passing locally
- ✅ Plugin structure validated
- ✅ Mock testing successful
- ✅ Examples working

You're ready to:
1. **Request OpenChat canister access**
2. **Update configuration with real canister ID**
3. **Deploy to production**
4. **Test with real OpenChat messages**

The plugin is **100% ready** - it just needs the real OpenChat connection! 🎯