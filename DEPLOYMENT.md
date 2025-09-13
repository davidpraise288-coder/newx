# OpenChat Plugin Deployment Guide

This guide covers how to deploy and configure the OpenChat plugin for production use with ElizaOS agents.

## 🚀 Production Deployment

### Prerequisites

1. **Internet Computer SDK (DFX)**
   ```bash
   sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
   dfx --version
   ```

2. **Node.js and npm**
   ```bash
   node --version  # >= 18.0.0
   npm --version   # >= 8.0.0
   ```

3. **OpenChat Canister Access**
   - Canister ID from OpenChat team
   - Appropriate permissions for your use case
   - Rate limit information

### Installation

#### Option 1: NPM Package (Recommended)

```bash
npm install @elizaos/plugin-openchat
```

#### Option 2: Build from Source

```bash
git clone <repository-url>
cd openchat-plugin
npm install
npm run build
npm pack
```

### Configuration

#### 1. Environment Variables

Create a production `.env` file:

```bash
# OpenChat Configuration
OPENCHAT_CANISTER_ID=your-production-canister-id
OPENCHAT_HOST=https://ic0.app
OPENCHAT_IDENTITY_PATH=/secure/path/to/identity.json

# Polling Configuration
OPENCHAT_POLLING_ENABLED=true
OPENCHAT_POLLING_INTERVAL=10000  # 10 seconds for production

# Feature Flags
OPENCHAT_ENABLE_DIRECT_MESSAGES=true
OPENCHAT_ENABLE_GROUP_CHATS=true
OPENCHAT_ENABLE_COMMUNITIES=true
OPENCHAT_ENABLE_CRYPTO=false  # Enable only if needed

# Performance Tuning
OPENCHAT_RETRY_TIMES=5
OPENCHAT_RETRY_DELAY=2000

# Security
OPENCHAT_DEBUG=false
OPENCHAT_LOG_LEVEL=warn
```

#### 2. Identity Management

Generate a production identity:

```bash
# Option A: Let the plugin generate one
# (Will be created automatically on first run)

# Option B: Pre-generate identity
node -e "
const { OpenChatAuth } = require('@elizaos/plugin-openchat');
const auth = new OpenChatAuth({ identityPath: './prod-identity.json' });
auth.initialize().then(identity => {
  console.log('Production Principal:', identity.getPrincipal().toString());
  process.exit(0);
});
"
```

**Security Best Practices:**
- Store identity files in secure locations (0600 permissions)
- Use separate identities for different environments
- Backup identity files securely
- Rotate identities periodically

#### 3. ElizaOS Integration

```typescript
// production-agent.ts
import { AgentRuntime } from '@elizaos/core';
import { 
  openChatPlugin, 
  loadConfigFromEnv, 
  initializeOpenChatPlugin 
} from '@elizaos/plugin-openchat';

async function createProductionAgent() {
  // Load configuration from environment
  const config = loadConfigFromEnv();
  
  // Validate configuration
  const { validateOpenChatConfig } = await import('@elizaos/plugin-openchat');
  const errors = validateOpenChatConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join(', ')}`);
  }

  // Create runtime with OpenChat plugin
  const runtime = new AgentRuntime({
    databaseAdapter: new YourProductionDatabaseAdapter(),
    token: process.env.AGENT_TOKEN,
    plugins: [openChatPlugin],
    character: {
      name: 'Production Agent',
      description: 'OpenChat-enabled production agent',
      // ... other character config
    },
  });

  // Initialize OpenChat plugin
  await initializeOpenChatPlugin(runtime, config);
  
  console.log('Production agent with OpenChat plugin ready');
  return runtime;
}

// Start the agent
createProductionAgent()
  .then(runtime => {
    console.log('Agent started successfully');
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      await runtime.stop();
      process.exit(0);
    });
  })
  .catch(error => {
    console.error('Failed to start agent:', error);
    process.exit(1);
  });
```

### Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

# Install DFX
RUN sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
ENV PATH="/root/.local/share/dfx/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/
COPY .env.production .env

# Create directory for identity files
RUN mkdir -p /app/data && chmod 700 /app/data

# Run as non-root user
RUN addgroup -g 1001 -S agent && \
    adduser -S agent -u 1001 -G agent && \
    chown -R agent:agent /app
USER agent

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the agent
CMD ["node", "dist/production-agent.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  openchat-agent:
    build: .
    container_name: openchat-agent-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - OPENCHAT_CANISTER_ID=${OPENCHAT_CANISTER_ID}
      - OPENCHAT_HOST=https://ic0.app
      - OPENCHAT_IDENTITY_PATH=/app/data/identity.json
    volumes:
      - ./data:/app/data:rw
      - ./logs:/app/logs:rw
    networks:
      - agent-network
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

networks:
  agent-network:
    driver: bridge
```

### Kubernetes Deployment

#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openchat-agent
  labels:
    app: openchat-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: openchat-agent
  template:
    metadata:
      labels:
        app: openchat-agent
    spec:
      containers:
      - name: openchat-agent
        image: your-registry/openchat-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENCHAT_CANISTER_ID
          valueFrom:
            secretKeyRef:
              name: openchat-secrets
              key: canister-id
        - name: OPENCHAT_IDENTITY_PATH
          value: "/app/data/identity.json"
        volumeMounts:
        - name: identity-storage
          mountPath: /app/data
        - name: logs-storage
          mountPath: /app/logs
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: identity-storage
        persistentVolumeClaim:
          claimName: openchat-identity-pvc
      - name: logs-storage
        persistentVolumeClaim:
          claimName: openchat-logs-pvc
---
apiVersion: v1
kind: Secret
metadata:
  name: openchat-secrets
type: Opaque
data:
  canister-id: <base64-encoded-canister-id>
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: openchat-identity-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: openchat-logs-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

## 🔧 Configuration Management

### Environment-Specific Configurations

#### Development
```typescript
const devConfig = configPresets.development();
```

#### Staging
```typescript
const stagingConfig = mergeConfig(
  configPresets.production('staging-canister-id'),
  {
    polling: { interval: 5000 },
    agentOptions: { retryTimes: 3 },
  }
);
```

#### Production
```typescript
const prodConfig = configPresets.production('prod-canister-id');
```

### Configuration Validation

```typescript
import { ConfigValidator } from '@elizaos/plugin-openchat';

// Validate before deployment
const errors = ConfigValidator.validateConfig(config);
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
  process.exit(1);
}
```

## 📊 Monitoring and Observability

### Health Checks

```typescript
// health-check.ts
import { OpenChatService } from '@elizaos/plugin-openchat';

export async function healthCheck(config: OpenChatConfig): Promise<boolean> {
  try {
    const service = new OpenChatService(config);
    await service.initialize();
    const isReady = service.isReady();
    await service.cleanup();
    return isReady;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
```

### Metrics Collection

```typescript
// metrics.ts
import { globalErrorReporter } from '@elizaos/plugin-openchat';

export function collectMetrics() {
  const stats = globalErrorReporter.getErrorStats();
  
  return {
    timestamp: new Date().toISOString(),
    errors: {
      total: stats.total,
      byCode: stats.byCode,
      mostCommon: stats.mostCommon,
    },
    // Add more metrics as needed
  };
}

// Export metrics every minute
setInterval(() => {
  const metrics = collectMetrics();
  console.log('Metrics:', JSON.stringify(metrics));
}, 60000);
```

### Logging Configuration

```typescript
// logging.ts
import { globalErrorHandler } from '@elizaos/plugin-openchat';

// Configure structured logging
globalErrorHandler.onAnyError((error) => {
  console.error(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    component: 'openchat-plugin',
    code: error.code,
    message: error.message,
    details: error.details,
  }));
});
```

## 🔒 Security Considerations

### Identity Security

1. **File Permissions**
   ```bash
   chmod 600 /path/to/identity.json
   chown agent:agent /path/to/identity.json
   ```

2. **Environment Variables**
   - Use secrets management (Kubernetes secrets, Docker secrets)
   - Never commit identity files or private keys
   - Rotate identities regularly

3. **Network Security**
   - Use HTTPS for all IC communications
   - Validate canister IDs
   - Implement rate limiting

### Input Validation

```typescript
// Validate all user inputs
function validatePrincipal(principalString: string): boolean {
  return /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/.test(principalString);
}

// Sanitize message content
function sanitizeMessage(message: string): string {
  return message.trim().substring(0, 1000); // Limit length
}
```

## 📈 Performance Optimization

### Polling Optimization

```typescript
// Adaptive polling based on activity
class AdaptivePoller {
  private baseInterval = 10000;
  private currentInterval = 10000;
  private maxInterval = 60000;
  private minInterval = 5000;

  adjustInterval(hasActivity: boolean) {
    if (hasActivity) {
      this.currentInterval = Math.max(this.minInterval, this.currentInterval / 2);
    } else {
      this.currentInterval = Math.min(this.maxInterval, this.currentInterval * 1.5);
    }
  }
}
```

### Connection Pooling

```typescript
// Reuse IC agent connections
class ConnectionPool {
  private agents = new Map<string, HttpAgent>();

  getAgent(host: string, identity: Identity): HttpAgent {
    const key = `${host}-${identity.getPrincipal().toString()}`;
    if (!this.agents.has(key)) {
      this.agents.set(key, new HttpAgent({ host, identity }));
    }
    return this.agents.get(key)!;
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failures**
   ```bash
   # Check identity file
   ls -la /path/to/identity.json
   
   # Verify principal format
   node -e "console.log(require('@dfinity/principal').Principal.fromText('your-principal'))"
   ```

2. **Network Connectivity**
   ```bash
   # Test IC connectivity
   curl -k https://ic0.app/api/v2/status
   
   # Test canister accessibility
   dfx canister --network ic call your-canister-id summary
   ```

3. **Memory Leaks**
   ```typescript
   // Monitor memory usage
   setInterval(() => {
     const usage = process.memoryUsage();
     console.log('Memory usage:', usage);
   }, 60000);
   ```

### Debug Mode

Enable debug logging:

```bash
export OPENCHAT_DEBUG=true
export OPENCHAT_LOG_LEVEL=debug
export NODE_ENV=development
```

### Log Analysis

```bash
# Filter OpenChat logs
grep "OpenChat" /var/log/agent.log

# Monitor error rates
grep "ERROR" /var/log/agent.log | wc -l

# Check recent errors
tail -f /var/log/agent.log | grep "OpenChat Error"
```

## 🔄 Updates and Maintenance

### Plugin Updates

```bash
# Check for updates
npm outdated @elizaos/plugin-openchat

# Update to latest version
npm update @elizaos/plugin-openchat

# Verify update
npm ls @elizaos/plugin-openchat
```

### Canister Updates

Monitor OpenChat canister updates and test compatibility:

```typescript
// Check canister version
async function checkCanisterVersion() {
  const response = await actor.summary();
  if ('Success' in response) {
    console.log('Canister version:', response.Success.wasm_version);
  }
}
```

### Backup and Recovery

```bash
# Backup identity files
cp /app/data/identity.json /backup/identity-$(date +%Y%m%d).json

# Backup configuration
cp .env /backup/env-$(date +%Y%m%d).bak

# Test recovery
# 1. Stop agent
# 2. Restore files
# 3. Start agent
# 4. Verify functionality
```

## 📋 Deployment Checklist

- [ ] OpenChat canister ID obtained
- [ ] Production environment configured
- [ ] Identity files secured (600 permissions)
- [ ] Environment variables set
- [ ] Configuration validated
- [ ] Health checks implemented
- [ ] Monitoring configured
- [ ] Logging set up
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Backup procedures established
- [ ] Documentation updated
- [ ] Team trained on operations

## 🆘 Emergency Procedures

### Agent Unresponsive

1. Check health endpoint
2. Review logs for errors
3. Restart container/pod
4. Verify IC connectivity
5. Check canister status

### High Error Rates

1. Check error statistics
2. Verify network connectivity
3. Check canister health
4. Review rate limits
5. Consider circuit breaker activation

### Data Loss

1. Stop agent immediately
2. Assess data loss scope
3. Restore from backups
4. Verify data integrity
5. Resume operations

---

For additional support, contact the ElizaOS team or OpenChat developers.