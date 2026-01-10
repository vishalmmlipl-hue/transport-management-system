// Delete Branches from Server
// Run this in browser console to delete branches directly from server

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  // Step 1: Get all branches
  console.log('1️⃣ Getting branches from server...');
  const getResponse = await fetch(`${API_URL}/branches`);
  const getData = await getResponse.json();
  
  if (!getData.success) {
    console.error('❌ Failed to get branches:', getData);
    return;
  }
  
  console.log(`Found ${getData.data.length} branches`);
  console.log('Branches:', getData.data.map(b => ({ id: b.id, name: b.branchName, status: b.status })));
  
  // Step 2: Enter branch IDs to delete (modify this array)
  const branchIdsToDelete = []; // Add IDs here, e.g., [1, 2, 3]
  
  if (branchIdsToDelete.length === 0) {
    console.log('\n⚠️ No branch IDs specified!');
    console.log('To delete branches, edit this script and add IDs to branchIdsToDelete array');
    console.log('Example: const branchIdsToDelete = [1, 2, 3];');
    return;
  }
  
  console.log(`\n2️⃣ Deleting ${branchIdsToDelete.length} branches...`);
  
  // Step 3: Delete each branch
  const deletePromises = branchIdsToDelete.map(async (id) => {
    try {
      const deleteResponse = await fetch(`${API_URL}/branches/${id}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      return { id, success: deleteData.success, data: deleteData };
    } catch (error) {
      return { id, success: false, error: error.message };
    }
  });
  
  const results = await Promise.all(deletePromises);
  
  // Step 4: Show results
  console.log('\n3️⃣ Delete Results:');
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ Deleted branch ID ${result.id}`);
    } else {
      console.error(`❌ Failed to delete branch ID ${result.id}:`, result.error || result.data);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Successfully deleted ${successCount} of ${branchIdsToDelete.length} branches`);
  
  // Step 5: Verify deletion
  console.log('\n4️⃣ Verifying deletion...');
  const verifyResponse = await fetch(`${API_URL}/branches`);
  const verifyData = await verifyResponse.json();
  
  if (verifyData.success) {
    console.log(`Remaining branches: ${verifyData.data.length}`);
    const remainingIds = verifyData.data.map(b => b.id);
    const deletedIds = branchIdsToDelete.filter(id => !remainingIds.includes(id));
    const stillExists = branchIdsToDelete.filter(id => remainingIds.includes(id));
    
    if (deletedIds.length > 0) {
      console.log(`✅ Successfully deleted: ${deletedIds.join(', ')}`);
    }
    if (stillExists.length > 0) {
      console.error(`❌ Still exists: ${stillExists.join(', ')}`);
    }
  }
  
  console.log('\n💡 Now clear localStorage on all systems:');
  console.log('localStorage.removeItem("branches");');
  console.log('window.location.reload();');
})();
