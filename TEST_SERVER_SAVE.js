// Test if server is actually saving data
// This simulates what the app does when creating a branch

const testBranch = {
  branchName: 'Server Test Branch',
  branchCode: 'SRV' + Date.now(),
  status: 'Active',
  address: 'Test Address',
  city: 'Test City',
  state: 'Test State',
  createdAt: new Date().toISOString()
};

console.log('🧪 Testing Server Save...\n');
console.log('Creating branch:', testBranch.branchName);

fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testBranch)
})
.then(async (response) => {
  console.log('Response status:', response.status);
  const data = await response.json();
  console.log('Response data:', data);
  
  if (data.success && data.data) {
    console.log('\n✅ Server accepted the data!');
    console.log('Created branch ID:', data.data.id);
    console.log('Branch code:', data.data.branchCode);
    
    // Wait 2 seconds then check if it's still there
    console.log('\n⏳ Waiting 2 seconds, then checking if it persisted...');
    setTimeout(() => {
      fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
        .then(r => r.json())
        .then(d => {
          const branches = d.data || [];
          const found = branches.find(b => b.branchCode === testBranch.branchCode);
          
          if (found) {
            console.log('✅ Branch persisted on server!');
            console.log('Total branches:', branches.length);
          } else {
            console.log('❌ Branch NOT found on server');
            console.log('⚠️ Data is not persisting - possible database issue');
            console.log('Total branches:', branches.length);
          }
        });
    }, 2000);
  } else {
    console.log('\n❌ Server rejected the data');
    console.log('Error:', data.error || data.message);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error);
});
