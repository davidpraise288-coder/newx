# OpenChat Message Flow Demo

## Real Conversation Example

**You (on OpenChat):** "Hello, are you there?"

**Agent (responds via OpenChat):** "Hello! I'm an ElizaOS agent connected to OpenChat. I can help you with various tasks. How can I assist you today?"

**You:** "Can you send a message to my friend at rdmx6-jaaaa-aaaah-qacaa-cai?"

**Agent:** "I can help you send a message! Just tell me what you'd like to say. For example: 'Send message to rdmx6-jaaaa-aaaah-qacaa-cai saying Hello from my agent!'"

**You:** "Send message to rdmx6-jaaaa-aaaah-qacaa-cai saying 'Hey, this is a message from my AI agent!'"

**Agent:** "Message sent successfully to rdmx6-jaaaa-aaaah-qacaa-cai! They should receive: 'Hey, this is a message from my AI agent!'"

## How It Works Behind the Scenes

1. **Message Detection**: Plugin polls OpenChat every 5 seconds for new messages
2. **Message Analysis**: Evaluator determines if agent should respond
3. **Response Generation**: Agent processes message and generates appropriate response
4. **Message Sending**: Plugin sends response back through OpenChat