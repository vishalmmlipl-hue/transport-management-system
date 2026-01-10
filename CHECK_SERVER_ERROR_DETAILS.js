// Check Server Error Details for Branch Creation
// Run this to see what error the server is returning

(async () => {
  console.log('🔍 Checking Server Error...\n');
  
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  if (localBranches.length === 0) {
    console.log('No branches in localStorage');
    return;
  }
  
  const branch = localBranches[0];
  console.log('Testing branch:', branch.branchName);
  console.log('Branch data:', JSON.stringify(branch, null, 2));
  
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    });
    
    console.log('\nResponse status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Error JSON:', json);
      if (json.error) {
        console.log('\n❌ Server Error:', json.error);
      }
    } catch (e) {
      console.log('Response is not JSON');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
})();
