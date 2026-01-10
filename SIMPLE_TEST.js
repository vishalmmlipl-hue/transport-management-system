// Simple Test - Copy this ENTIRE block into console
(async () => {
  console.log('Testing API...');
  const testBranch = {
    branchName: 'Test ' + Date.now(),
    branchCode: 'TEST' + Date.now(),
    address: 'Test',
    city: 'Test',
    state: 'Test',
    status: 'Active'
  };
  
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    const data = await response.json();
    console.log('Result:', data);
    
    if (data.success) {
      console.log('✅ API CREATE WORKS!');
      const check = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
      const checkData = await check.json();
      console.log('Server now has:', checkData.data.length, 'branches');
    } else {
      console.error('❌ API CREATE FAILED:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
