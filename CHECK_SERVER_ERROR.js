// Check Server Error Details
// Run this to see what error the server is returning

(async () => {
  console.log('🔍 Checking Server Error Details...\n');
  
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  const missing = ['Mumbai Head Office', 'Delhi Branch', 'Bangalore Branch'];
  
  for (let i = 0; i < missing.length; i++) {
    const branchName = missing[i];
    const branch = localBranches.find(function(b) { return b.branchName === branchName; });
    
    if (branch) {
      console.log('Testing:', branchName);
      console.log('Branch data:', JSON.stringify(branch, null, 2));
      
      try {
        const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branch)
        });
        
        console.log('Status:', response.status);
        
        const text = await response.text();
        console.log('Response:', text);
        
        try {
          const json = JSON.parse(text);
          console.log('Error details:', json);
        } catch (e) {
          console.log('Response is not JSON');
        }
        
      } catch (error) {
        console.error('Error:', error);
      }
      
      console.log('\n');
    }
  }
})();
