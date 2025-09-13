#!/usr/bin/env node

/**
 * Script to help find OpenChat canister IDs
 * Run: node scripts/find-openchat-canisters.js
 */

console.log('🔍 How to Find OpenChat Canister IDs');
console.log('====================================\n');

console.log('Method 1: OpenChat Website Inspection');
console.log('1. Go to https://oc.app');
console.log('2. Open browser Developer Tools (F12)');
console.log('3. Go to Network tab');
console.log('4. Send a message or join a group');
console.log('5. Look for requests to ic0.app');
console.log('6. Find canister IDs in the URLs\n');

console.log('Method 2: IC Dashboard');
console.log('1. Go to https://dashboard.internetcomputer.org');
console.log('2. Search for "OpenChat"');
console.log('3. Look at official OpenChat canisters\n');

console.log('Method 3: GitHub/Documentation');
console.log('1. Check OpenChat GitHub repository');
console.log('2. Look for canister IDs in documentation');
console.log('3. Check deployment scripts\n');

console.log('Method 4: Contact OpenChat Team');
console.log('1. Join OpenChat Discord/Telegram');
console.log('2. Ask for official API documentation');
console.log('3. Request canister IDs for bot integration\n');

console.log('What to Look For:');
console.log('- User service canister (for user management)');
console.log('- Group service canister (for group management)'); 
console.log('- Message service canister (for messaging)');
console.log('- Storage canister (for media)');

console.log('\nCanister ID Format:');
console.log('xxxxx-xxxxx-xxxxx-xxxxx-xxx');
console.log('Example: rdmx6-jaaaa-aaaah-qacaa-cai');

console.log('\n🚨 Important:');
console.log('You need OFFICIAL canister IDs from OpenChat team');
console.log('Random/example IDs will not work');
console.log('Contact OpenChat for proper API access');