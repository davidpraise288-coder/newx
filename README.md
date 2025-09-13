# OpenChat Plugin for ElizaOS

A comprehensive plugin that enables ElizaOS agents to interact with OpenChat, a decentralized messaging platform built on the Internet Computer blockchain.

## 🌟 Features

- **Direct Messaging**: Send and receive direct messages on OpenChat
- **Group Management**: Join, leave, and participate in group chats
- **Community Integration**: Interact with OpenChat communities
- **Real-time Polling**: Monitor for new messages in real-time
- **Identity Management**: Secure IC identity handling with Ed25519 keys
- **Crypto Integration**: Handle cryptocurrency transactions (optional)
- **Rich Message Types**: Support for text, media, polls, and more
- **Error Recovery**: Robust error handling with retry mechanisms
- **Memory Management**: Persistent conversation history
- **ElizaOS Integration**: Full integration with ElizaOS actions, evaluators, and providers

## 🚀 Quick Start

### Installation

```bash
npm install @elizaos/plugin-openchat
```

### Basic Setup

```typescript
import { AgentRuntime } from '@elizaos/core';
import { openChatPlugin, createOpenChatConfig, initializeOpenChatPlugin } from '@elizaos/plugin-openchat';

// Create configuration
const config = createOpenChatConfig({
  canisterId: 'your-openchat-canister-id',
  host: 'https://ic0.app',
  enablePolling: true,
  pollingInterval: 5000,
});

// Create agent runtime with plugin
const runtime = new AgentRuntime({
  plugins: [openChatPlugin],
});

// Initialize the plugin
await initializeOpenChatPlugin(runtime, config);

console.log('OpenChat plugin is ready!');
```

### Environment Configuration

Create a `.env` file:

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your values
OPENCHAT_CANISTER_ID=your-openchat-canister-id-here
OPENCHAT_HOST=https://ic0.app
OPENCHAT_POLLING_ENABLED=true
OPENCHAT_POLLING_INTERVAL=5000
```

## 📖 Usage Examples

### Sending Messages

The agent can send messages when prompted:

```
User: "Send a message to rdmx6-jaaaa-aaaah-qacaa-cai saying 'Hello from ElizaOS!'"
Agent: "Message sent successfully to rdmx6-jaaaa-aaaah-qacaa-cai"
```

### Joining Groups

```
User: "Join OpenChat group be2us-64aaa-aaaah-qaabq-cai"
Agent: "Successfully joined OpenChat group be2us-64aaa-aaaah-qaabq-cai"
```

### Getting Message History

```
User: "Get OpenChat messages from rdmx6-jaaaa-aaaah-qacaa-cai"
Agent: "Found 5 messages from rdmx6-jaaaa-aaaah-qacaa-cai:
1. [10:30 AM] Hello there!
2. [10:25 AM] How are you?
..."
```

## 🔧 Configuration

### Basic Configuration

```typescript
import { createOpenChatConfig } from '@elizaos/plugin-openchat';

const config = createOpenChatConfig({
  canisterId: 'your-canister-id',
  host: 'https://ic0.app',
  enablePolling: true,
  pollingInterval: 5000,
  features: {
    enableDirectMessages: true,
    enableGroupChats: true,
    enableCommunities: false,
    enableCrypto: false,
  },
});
```

### Advanced Configuration with Builder

```typescript
import { createConfig } from '@elizaos/plugin-openchat';

const config = createConfig()
  .canister('your-canister-id')
  .host('https://ic0.app')
  .identity('./my-identity.json')
  .polling(true, 3000)
  .retries(5, 2000)
  .enableFeature('enableDirectMessages', true)
  .enableFeature('enableGroupChats', true)
  .build();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `canisterId` | string | required | OpenChat canister Principal ID |
| `host` | string | `'https://ic0.app'` | Internet Computer host URL |
| `identity` | string | auto-generated | Path to identity file |
| `polling.enabled` | boolean | `true` | Enable message polling |
| `polling.interval` | number | `5000` | Polling interval in milliseconds |
| `features.enableDirectMessages` | boolean | `true` | Enable direct messaging |
| `features.enableGroupChats` | boolean | `true` | Enable group chats |
| `features.enableCommunities` | boolean | `false` | Enable communities |
| `features.enableCrypto` | boolean | `false` | Enable crypto transactions |

## 🏗️ Architecture

### Core Components

```
OpenChat Plugin
├── Actions/           # ElizaOS actions for OpenChat operations
│   ├── send-message.ts
│   ├── join-group.ts
│   ├── leave-group.ts
│   └── get-messages.ts
├── Evaluators/        # Message evaluation and context analysis
│   └── openchat-evaluator.ts
├── Providers/         # Context and memory providers
│   └── openchat-provider.ts
├── Utils/             # Core utilities
│   ├── ic-client.ts   # Internet Computer client
│   ├── message-handler.ts # Message processing
│   ├── auth.ts        # Authentication management
│   └── error-handler.ts # Error handling
└── Types/             # TypeScript definitions
    └── openchat.types.ts
```

### Message Flow

```
OpenChat Message → IC Client → Message Handler → Evaluator → Agent → Action → Response
```

## 🔐 Authentication

The plugin supports two authentication modes:

### Service Identity (Recommended for Agents)

Automatically generates and manages Ed25519 key pairs:

```typescript
const auth = new OpenChatAuth({
  identityPath: './agent-identity.json',
  useInternetIdentity: false,
});

const identity = await auth.initialize();
console.log('Agent Principal:', identity.getPrincipal().toString());
```

### Internet Identity (For Interactive Use)

Uses Internet Identity for user authentication:

```typescript
const auth = new OpenChatAuth({
  useInternetIdentity: true,
  maxTimeToLive: BigInt(8 * 60 * 60 * 1000 * 1000 * 1000), // 8 hours
});

const identity = await auth.initialize(); // Opens II login
```

## 🔌 Direct Service Usage

You can use the OpenChat functionality without the full ElizaOS plugin:

```typescript
import { OpenChatService } from '@elizaos/plugin-openchat';

const service = new OpenChatService(config);
await service.initialize();

// Send a message
await service.sendMessage('recipient-principal', 'Hello from service!');

// Join a group
await service.joinGroup('group-principal');

// Get current user
console.log('Current user:', service.getCurrentUser());

// Clean up
await service.cleanup();
```

## 🛠️ Development

### Setup Development Environment

```bash
# Install IC SDK
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# Clone and install dependencies
git clone <repository>
cd openchat-plugin
npm install

# Start local IC replica (optional)
dfx start --background

# Run tests
npm test

# Build the plugin
npm run build
```

### Running Examples

```bash
# Basic usage example
npm run example:basic

# Advanced usage example
npm run example:advanced
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- plugin.test.ts
```

## 📚 API Reference

### Actions

#### SEND_OPENCHAT_MESSAGE
Sends a message to an OpenChat user or group.

**Triggers:**
- "send message to [principal] saying [message]"
- "openchat send [message] to [principal]"
- "message [principal]: [message]"

#### JOIN_OPENCHAT_GROUP
Joins an OpenChat group or community.

**Triggers:**
- "join openchat group [principal]"
- "join [principal]"
- "openchat join [principal] with invite code [code]"

#### LEAVE_OPENCHAT_GROUP
Leaves an OpenChat group or community.

**Triggers:**
- "leave openchat group [principal]"
- "openchat leave [principal]"
- "exit openchat group [principal]"

#### GET_OPENCHAT_MESSAGES
Retrieves message history from a chat.

**Triggers:**
- "get openchat messages from [principal]"
- "show message history with [principal]"
- "openchat fetch last [number] messages from [principal]"

### Evaluators

#### OPENCHAT_MESSAGE_EVALUATOR
Evaluates incoming messages for OpenChat context and determines response necessity.

**Features:**
- Detects OpenChat message format
- Analyzes chat type (direct/group/community)
- Identifies mentions and reactions
- Determines if agent should respond

### Providers

#### OPENCHAT_PROVIDER
Provides comprehensive OpenChat context including:
- Current user information
- Active chat summaries
- Recent message history
- Available commands

#### OPENCHAT_MEMORY_PROVIDER
Provides conversation history and memory context for specific chats.

## 🚨 Error Handling

The plugin includes comprehensive error handling:

```typescript
import { 
  OpenChatErrorHandler, 
  ErrorRecoveryManager, 
  CircuitBreaker 
} from '@elizaos/plugin-openchat';

// Global error handler
const errorHandler = new OpenChatErrorHandler();
errorHandler.onError('NETWORK_ERROR', (error) => {
  console.log('Network error occurred:', error.message);
});

// Retry failed operations
const recovery = new ErrorRecoveryManager(3, 1000);
await recovery.executeWithRetry(() => sendMessage(), 'send-message');

// Circuit breaker for preventing cascading failures
const breaker = new CircuitBreaker(5, 60000);
await breaker.execute(() => riskyOperation());
```

## 🔍 Monitoring and Debugging

Enable debug logging:

```bash
export OPENCHAT_DEBUG=true
export OPENCHAT_LOG_LEVEL=debug
```

Monitor error statistics:

```typescript
import { globalErrorReporter } from '@elizaos/plugin-openchat';

const stats = globalErrorReporter.getErrorStats();
console.log('Total errors:', stats.total);
console.log('Most common error:', stats.mostCommon);
console.log('Recent errors:', stats.recent);
```

## 📋 Requirements from OpenChat Team

To build and deploy this plugin, you'll need to request the following from the OpenChat team:

### Technical Documentation
- [ ] Complete Candid interface definitions (.did files)
- [ ] API rate limits and best practices
- [ ] Authentication patterns for bots/agents
- [ ] Real-time event system documentation (if available)
- [ ] Message format specifications

### Development Resources
- [ ] Test environment access
- [ ] Development canister IDs
- [ ] Sample integration code
- [ ] Official SDK or client libraries
- [ ] Staging environment for testing

### Access and Permissions
- [ ] Bot/agent account creation process
- [ ] Required permissions for automated messaging
- [ ] Community guidelines for agent behavior
- [ ] Production deployment verification process
- [ ] Whitelist process (if required)

### Infrastructure Details
- [ ] Canister upgrade policies and notifications
- [ ] Message delivery guarantees and SLAs
- [ ] Error handling best practices
- [ ] Monitoring and logging capabilities
- [ ] Backup and disaster recovery procedures

### Business and Legal
- [ ] Terms of service for automated accounts
- [ ] Rate limiting policies and enforcement
- [ ] Data retention and privacy policies
- [ ] Compliance requirements (GDPR, etc.)
- [ ] Commercial usage terms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the examples and API reference
- **Issues**: Report bugs on GitHub
- **Discussions**: Join the ElizaOS community
- **OpenChat**: Contact the OpenChat team for canister access

## 🔮 Roadmap

- [ ] WebSocket support for real-time messages
- [ ] Advanced crypto transaction handling
- [ ] Community governance integration
- [ ] NFT and token-gated chat support
- [ ] Voice message support
- [ ] File upload and sharing
- [ ] Advanced moderation features
- [ ] Analytics and reporting
- [ ] Multi-agent coordination
- [ ] Plugin marketplace integration

---

**Note**: This plugin requires access to OpenChat canisters on the Internet Computer. Contact the OpenChat team for canister IDs and access permissions.