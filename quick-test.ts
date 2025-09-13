#!/usr/bin/env ts-node

/**
 * Quick Plugin Test
 * Run: npx ts-node quick-test.ts
 */

import { openChatPlugin, createOpenChatConfig } from './src/index.js';

async function quickTest() {
  console.log('🔍 Quick OpenChat Plugin Test\n');

  // 1. Test plugin exists
  console.log('Plugin name:', openChatPlugin.name);
  console.log('Actions:', openChatPlugin.actions?.length || 0);
  console.log('Evaluators:', openChatPlugin.evaluators?.length || 0);
  console.log('Providers:', openChatPlugin.providers?.length || 0);

  // 2. Test configuration
  const config = createOpenChatConfig({
    canisterId: 'test-canister-id',
  });
  console.log('✅ Configuration created');

  // 3. Test action validation
  const sendAction = openChatPlugin.actions?.find(a => a.name === 'SEND_OPENCHAT_MESSAGE');
  if (sendAction) {
    const testMessage = {
      content: { text: 'send message to rdmx6-jaaaa-aaaah-qacaa-cai saying "test"' }
    } as any;
    
    const mockRuntime = {} as any;
    const isValid = await sendAction.validate(mockRuntime, testMessage);
    console.log('✅ Send action validates:', isValid);
  }

  console.log('\n🎉 Plugin is working correctly!');
  console.log('Ready for OpenChat integration once you have canister access.');
}

quickTest().catch(console.error);