// Test if syncService.save is working
// Run this BEFORE creating a branch to intercept the save

console.log('🔍 Setting up test...\n');

// Override console.log temporarily to catch all logs
const originalLog = console.log;
const logs = [];

console.log = function(...args) {
  logs.push(args.join(' '));
  originalLog.apply(console, args);
};

// Also check Network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('branches')) {
    console.log('🌐 FETCH DETECTED:', url, args[1]?.method || 'GET');
  }
  return originalFetch.apply(window, args);
};

console.log('✅ Test setup complete!');
console.log('Now create a branch and watch for logs...\n');
console.log('After creating, run: console.log(logs.join("\\n"))');
