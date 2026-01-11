/**
 * TEST: Auto-Sync Right Now
 * 
 * Run this to manually trigger auto-sync and see what happens
 */

(async () => {
  console.log('🧪 Testing Auto-Sync Right Now...\n');
  
  // Clear session flag to allow re-sync
  sessionStorage.removeItem('autoSyncCompleted');
  
  // Import and run auto-sync
  try {
    const autoSync = await import('./src/utils/autoSyncToServer.js');
    console.log('✅ Auto-sync module loaded');
    
    // Run it
    await autoSync.default();
    
    console.log('\n✅ Auto-sync completed!');
    console.log('\n💡 Check the messages above to see what was synced.');
    
    // Verify branches on server
    console.log('\n📊 Verifying branches on server...');
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const data = await response.json();
    console.log(`Server now has ${data.data?.length || 0} branches:`);
    data.data?.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.branchName} (${b.branchCode})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Try reloading the page - auto-sync runs automatically on load');
  }
})();
