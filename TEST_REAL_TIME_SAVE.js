// Test if data created in app actually saves to server
// Run this BEFORE creating a branch, then create branch, then check again

console.log('🧪 Real-Time Save Test\n');

// Step 1: Check current count
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(d => {
    const before = (d.data || []).length;
    console.log(`📦 Branches BEFORE creating: ${before}`);
    
    console.log('\n⏳ Now create a branch in your app...');
    console.log('   (Fill in branch details and click Save)');
    console.log('\n⏳ After creating, wait 2 seconds, then run this again:');
    console.log(`
fetch('https://transport-management-system-wzhx.onrender.com/api/branches')
  .then(r => r.json())
  .then(d => {
    const after = (d.data || []).length;
    console.log('📦 Branches AFTER creating:', after);
    if (after > before) {
      console.log('✅ Branch saved to server!');
      console.log('Latest:', d.data[d.data.length - 1]);
    } else {
      console.log('❌ Branch NOT on server');
      console.log('Check Network tab for POST request errors');
    }
  });
    `);
  });
