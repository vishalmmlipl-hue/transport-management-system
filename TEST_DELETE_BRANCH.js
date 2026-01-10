// Test Delete Branch Function
// Run this in browser console to test if delete is working

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🧪 Testing Branch Delete...\n');
  
  // Step 1: Get all branches
  console.log('1️⃣ Getting all branches from server...');
  const getResponse = await fetch(`${API_URL}/branches`);
  const getData = await getResponse.json();
  
  if (getData.success) {
    console.log('✅ Branches on server:', getData.data.length);
    console.log('Branches:', getData.data.map(b => ({ id: b.id, name: b.branchName, status: b.status })));
    
    // Step 2: Try to delete a branch (use first branch ID)
    if (getData.data.length > 0) {
      const branchToDelete = getData.data[0];
      console.log(`\n2️⃣ Attempting to delete branch: ${branchToDelete.branchName} (ID: ${branchToDelete.id})`);
      
      const deleteResponse = await fetch(`${API_URL}/branches/${branchToDelete.id}`, {
        method: 'DELETE'
      });
      
      const deleteData = await deleteResponse.json();
      
      if (deleteData.success) {
        console.log('✅ Delete successful!');
        
        // Step 3: Verify it's deleted
        console.log('\n3️⃣ Verifying deletion...');
        const verifyResponse = await fetch(`${API_URL}/branches`);
        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          const stillExists = verifyData.data.find(b => b.id === branchToDelete.id);
          if (stillExists) {
            console.error('❌ Branch still exists on server!');
            console.log('Branch:', stillExists);
          } else {
            console.log('✅ Branch successfully deleted from server!');
            console.log('Remaining branches:', verifyData.data.length);
          }
        }
      } else {
        console.error('❌ Delete failed:', deleteData);
      }
    } else {
      console.log('No branches to delete');
    }
  } else {
    console.error('❌ Failed to get branches:', getData);
  }
})();
