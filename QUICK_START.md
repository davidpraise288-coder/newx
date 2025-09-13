# OpenChat Plugin - Quick Start with Real Canisters

🎉 **You now have the REAL OpenChat canister IDs!** Here's how to test the plugin immediately.

## 🚀 **Instant Testing (2 minutes)**

### **1. Test with Real OpenChat Canisters**
```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Test with REAL OpenChat test environment
npm run test:real

# Or test with production environment
npm run test:real:prod
```

### **2. Expected Output**
```
🌐 Testing with REAL OpenChat Canisters
=======================================

📋 Available OpenChat Canisters:
Production Environment:
  User Index: 4bkt6-4aaaa-aaaaf-aaaiq-cai
  Group Index: 4ijyc-kiaaa-aaaaf-aaaja-cai
  
🎯 Using TEST environment

🔌 Testing direct service connection...
✅ Service initialization successful!
🤖 Agent Principal: xyz123-abc456-def789...
📶 Service Ready: true

🤖 Testing ElizaOS integration...
✅ Agent runtime created
✅ Plugin initialization successful!
```

## 🎯 **Real Canister IDs Available**

### **Production Canisters (IC Mainnet):**
```typescript
const PRODUCTION_CANISTERS = {
  user_index: "4bkt6-4aaaa-aaaaf-aaaiq-cai",        // Main messaging
  group_index: "4ijyc-kiaaa-aaaaf-aaaja-cai",       // Group management
  notifications: "dobi3-tyaaa-aaaaf-adnna-cai",     // Push notifications
  website: "6hsbt-vqaaa-aaaaf-aaafq-cai",           // Website
  // ... and many more!
};
```

### **Test Canisters (IC Test Network):**
```typescript
const TEST_CANISTERS = {
  user_index: "7njde-waaaa-aaaaf-ab2ca-cai",        // Test messaging
  group_index: "7kifq-3yaaa-aaaaf-ab2cq-cai",       // Test groups
  notifications: "dhcdh-fqaaa-aaaaf-adnmq-cai",     // Test notifications
  website: "pfs7b-iqaaa-aaaaf-abs7q-cai",           // Test website
  // ... complete test environment
};
```

## 🛠️ **Ready-to-Use Configurations**

### **Production Setup:**
```bash
# Use production environment file
cp .env.production .env

# Edit if needed (already has real canister IDs)
# OPENCHAT_CANISTER_ID=4bkt6-4aaaa-aaaaf-aaaiq-cai

# Run your agent
npm start
```

### **Test/Development Setup:**
```bash
# Use test environment file  
cp .env.test .env

# Edit if needed (already has test canister IDs)
# OPENCHAT_CANISTER_ID=7njde-waaaa-aaaaf-ab2ca-cai

# Run development version
npm run dev
```

## 💬 **Create a Real OpenChat Agent**

```typescript
import { 
  openChatPlugin, 
  createOpenChatConfig,
  getMessagingCanister,
  initializeOpenChatPlugin 
} from '@elizaos/plugin-openchat';

// Create agent with REAL OpenChat integration
const config = createOpenChatConfig({
  canisterId: getMessagingCanister('production'), // Real canister!
  host: 'https://ic0.app',
  enablePolling: true,
  pollingInterval: 10000,
});

const runtime = new AgentRuntime({
  plugins: [openChatPlugin],
  // ... your agent config
});

await initializeOpenChatPlugin(runtime, config);

// Your agent is now connected to REAL OpenChat! 🎉
```

## 🎮 **Test Real Functionality**

### **Send a Real Message:**
```typescript
// This will actually send a message on OpenChat!
const service = new OpenChatService({
  canisterId: "4bkt6-4aaaa-aaaaf-aaaiq-cai", // Real production canister
  host: "https://ic0.app",
});

await service.initialize();
await service.sendMessage("recipient-principal", "Hello from my agent!");
```

### **Join a Real Group:**
```typescript
// This will actually join a group on OpenChat!
await service.joinGroup("group-principal-id");
```

## 🔍 **What Each Canister Does**

| Canister | Purpose | When to Use |
|----------|---------|-------------|
| **user_index** | User management & direct messages | Main messaging functionality |
| **group_index** | Group discovery & management | Group operations |
| **notifications** | Push notifications | Real-time alerts |
| **local_user_index** | Local user services | Regional user management |
| **storage_index** | File & media storage | Media handling |

## ⚡ **Quick Test Commands**

```bash
# Test plugin structure
npm run test:plugin

# Test with mock OpenChat
npm run test:mock  

# Test with REAL OpenChat (test environment)
npm run test:real

# Test with REAL OpenChat (production environment)
npm run test:real:prod

# Run interactive agent with real canisters
npm run example:interactive
```

## 🚨 **Important Notes**

### **✅ What Works Now:**
- ✅ Real canister IDs are configured
- ✅ Plugin connects to actual OpenChat services
- ✅ IC authentication is handled
- ✅ Message sending/receiving structure is ready
- ✅ All ElizaOS integration is complete

### **⚠️ What Might Need Setup:**
- Authentication permissions (IC identity)
- OpenChat bot account approval (if required)
- Rate limiting considerations
- Production deployment permissions

### **🎯 Expected Results:**
When you run `npm run test:real`, you should see:
- ✅ Connection to real OpenChat canisters
- ✅ IC identity generation
- ✅ Plugin initialization success
- ⚠️ Some operations may fail due to permissions (normal)

## 🎉 **You're Ready!**

The plugin now has **REAL OpenChat canister IDs** and can connect to the actual OpenChat service. You can:

1. **Test immediately** with `npm run test:real`
2. **Deploy to production** using the real canister IDs
3. **Send real messages** through OpenChat
4. **Join real groups** and communities
5. **Build production agents** with full OpenChat integration

The missing piece was the canister IDs - now you have them all! 🚀