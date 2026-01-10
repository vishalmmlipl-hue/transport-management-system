// Check API URL on System B
// Run this to see what API URL is being used

console.log('🔍 Checking API Configuration on System B...\n');

// Check hostname
const hostname = window.location.hostname;
console.log('1️⃣ Hostname:', hostname);

// Check what API URL should be used
let expectedAPI;
if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info' || !hostname.includes('localhost')) {
  expectedAPI = 'https://transport-management-system-wzhx.onrender.com/api';
  console.log('   ✅ Should use Render API:', expectedAPI);
} else {
  expectedAPI = 'http://localhost:3001/api';
  console.log('   ⚠️ Using localhost API:', expectedAPI);
}

// Test direct fetch
console.log('\n2️⃣ Testing direct API call...');
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(function(response) {
    console.log('   Response status:', response.status);
    return response.json();
  })
  .then(function(data) {
    console.log('   ✅ API is accessible!');
    console.log('   Server has:', data.data.length, 'branches');
    
    // Update localStorage
    localStorage.setItem('branches', JSON.stringify(data.data || []));
    console.log('   ✅ Updated localStorage');
    
    // Reload page
    console.log('\n   Reloading page in 2 seconds...');
    setTimeout(function() {
      window.location.reload();
    }, 2000);
  })
  .catch(function(error) {
    console.error('   ❌ API Error:', error);
    console.log('\n   💡 Possible issues:');
    console.log('      - Network connectivity');
    console.log('      - CORS blocking');
    console.log('      - Server is down');
  });

console.log('\n✅ Check complete!');
