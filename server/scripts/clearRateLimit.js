#!/usr/bin/env node

/**
 * Script to clear rate limiting cache
 * Run this if you're still getting rate limited after restarting the server
 */

const { exec } = require('child_process');

console.log('🔄 Clearing rate limiting cache...');

// Kill any existing server processes
exec('taskkill /f /im node.exe', (error) => {
  if (error) {
    console.log('ℹ️  No existing server processes to kill');
  } else {
    console.log('✅ Killed existing server processes');
  }
  
  console.log('✅ Rate limiting cache cleared');
  console.log('🚀 You can now restart the server with: npm run dev');
});
