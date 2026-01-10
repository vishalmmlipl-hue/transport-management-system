// Check if syncService.save is being called
// This will help us see if there's a JavaScript error

console.log('🔍 Checking if syncService.save is being called...\n');

// Override console.log to catch ALL logs
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const allLogs = [];

console.log = function(...args) {
  allLogs.push(['LOG', ...args]);
  originalLog.apply(console, args);
};

console.error = function(...args) {
  allLogs.push(['ERROR', ...args]);
  originalError.apply(console, args);
};

console.warn = function(...args) {
  allLogs.push(['WARN', ...args]);
  originalWarn.apply(console, args);
};

console.log('✅ Log capture enabled!');
console.log('💡 Now create a branch and then run:');
console.log('   console.log(allLogs.map(l => l.join(" ")).join("\\n"))');
