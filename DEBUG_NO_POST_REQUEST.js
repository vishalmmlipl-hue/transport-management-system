// Debug Why No POST Request is Being Made
// This will help us understand what's happening

console.log('🔍 Debugging: Why No POST Request?\n');

// Check 1: Is syncService imported correctly?
console.log('1️⃣ Checking if syncService is available...');
console.log('   (This will show if there are import errors)');

// Check 2: Test API URL
console.log('\n2️⃣ Checking API URL...');
const hostname = window.location.hostname;
console.log('   Hostname:', hostname);

let expectedAPI;
if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info' || !hostname.includes('localhost')) {
  expectedAPI = 'https://transport-management-system-wzhx.onrender.com/api';
} else {
  expectedAPI = 'http://localhost:3001/api';
}
console.log('   Expected API:', expectedAPI);

// Check 3: Test direct API call
console.log('\n3️⃣ Testing direct API call...');
const testBranch = {
  branchName: 'Direct API Test',
  branchCode: 'DIRECT' + Date.now(),
  address: 'Test',
  city: 'Test',
  state: 'Test',
  status: 'Active'
};

fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testBranch)
})
.then(function(response) {
  console.log('   Response status:', response.status);
  return response.json();
})
.then(function(data) {
  if (data.success) {
    console.log('   ✅ Direct API call WORKS!');
    console.log('   This means the server is accessible');
  } else {
    console.error('   ❌ Direct API call failed:', data);
  }
})
.catch(function(error) {
  console.error('   ❌ Direct API call error:', error);
});

console.log('\n💡 Next Steps:');
console.log('   1. Check console logs when creating a branch');
console.log('   2. Look for: 💾 Saving branches to server...');
console.log('   3. If you see that log, the API call should happen');
console.log('   4. If you DON\'T see that log, syncService.save() isn\'t being called');
