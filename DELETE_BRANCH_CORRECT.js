// Delete Branch from Server (Corrected Syntax)
// Replace BRANCH_ID with the actual branch ID number

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  const branchId = BRANCH_ID; // ⚠️ REPLACE THIS with actual ID (e.g., 1, 2, 3)
  
  if (!branchId || branchId === 'BRANCH_ID') {
    console.error('❌ Please set branchId variable first!');
    console.log('Example: const branchId = 1;');
    return;
  }
  
  console.log(`🗑️ Deleting branch ID: ${branchId}`);
  
  try {
    const response = await fetch(`${API_URL}/branches/${branchId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Branch deleted from server!');
      console.log('🧹 Clearing cache...');
      
      // Clear cache
      localStorage.removeItem('branches');
      
      console.log('🔄 Reloading page...');
      window.location.reload();
    } else {
      console.error('❌ Delete failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
