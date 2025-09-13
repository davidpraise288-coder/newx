# OpenChat Canister Architecture

## How OpenChat Works on Internet Computer

```
OpenChat Platform
├── 📦 User Index Canister          (manages users)
├── 📦 Group Index Canister         (manages groups)  
├── 📦 Community Canister           (manages communities)
├── 📦 Individual Group Canisters   (one per group)
├── 📦 Individual User Canisters    (one per user)
└── 📦 Storage Canisters            (media/files)
```

## What You Need for the Plugin

### Option 1: Main OpenChat Service Canister
```typescript
// This would be the main OpenChat service
canisterId: "6hsbt-vqaaa-aaaaf-aaafq-cai"  // Example
```

### Option 2: Specific Chat/Group Canister
```typescript
// This would be a specific group or chat
canisterId: "rdmx6-jaaaa-aaaah-qacaa-cai"  // Example
```

### Option 3: User-specific Canister
```typescript
// This would be for a specific user's messages
canisterId: "be2us-64aaa-aaaah-qaabq-cai"  // Example
```

## How the Plugin Uses Canister ID

```typescript
// The plugin needs to know which canister to talk to
const config = createOpenChatConfig({
  canisterId: 'your-openchat-canister-id',  // ← This is what you need
  host: 'https://ic0.app',
});

// Plugin will make calls to:
// https://ic0.app/api/v2/canister/your-openchat-canister-id/call
```

## Finding OpenChat Canister IDs

### Method 1: OpenChat Website
1. Go to openchat.com
2. Open browser developer tools
3. Look at network requests
4. Find canister IDs in API calls

### Method 2: IC Dashboard
1. Visit dashboard.internetcomputer.org
2. Search for "OpenChat"
3. Find official OpenChat canisters

### Method 3: Ask OpenChat Team
- Contact OpenChat developers
- Request official canister IDs
- Ask for API documentation

## Example Real OpenChat Canisters

**Note: These are examples - you need official ones from OpenChat team**

```typescript
// Possible OpenChat service canisters (examples)
const OPENCHAT_CANISTERS = {
  userIndex: "4bkt6-4aaaa-aaaaf-aaaiq-cai",
  groupIndex: "4ijyc-kiaaa-aaaaf-aaaja-cai", 
  notifications: "xkbpv-2qaaa-aaaah-qc7gq-cai",
  // ... more service canisters
};
```

## What Each Canister Type Does

| Canister Type | Purpose | Plugin Needs It For |
|---------------|---------|-------------------|
| **User Index** | Manage user accounts | User authentication |
| **Group Index** | Manage group listings | Finding/joining groups |
| **Individual Groups** | Store group messages | Send/receive group messages |
| **Individual Users** | Store direct messages | Send/receive direct messages |
| **Storage** | Store media files | Handle images/files |

## Why You Need the Right Canister ID

```typescript
// Wrong canister = plugin can't connect
canisterId: "wrong-canister-id"  // ❌ Plugin fails

// Right canister = plugin works perfectly  
canisterId: "official-openchat-canister"  // ✅ Plugin works
```