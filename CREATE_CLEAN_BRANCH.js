// Create a Clean Branch on Server
// This will create a branch with only the required fields

(async () => {
  console.log('📦 Creating Clean Branch on Server...\n');
  
  const cleanBranch = {
    branchName: 'Main Branch',
    branchCode: 'MAIN001',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '022-12345678',
    email: 'main@company.com',
    status: 'Active',
    lrSeriesStart: '1000000001',
    lrSeriesEnd: '1999999999',
    lrSeriesCurrent: '1000000001',
    lrPrefix: 'MAIN'
  };
  
  console.log('Creating branch:', cleanBranch.branchName);
  console.log('Branch data:', JSON.stringify(cleanBranch, null, 2));
  
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanBranch)
    });
    
    console.log('\nResponse status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    
    try {
      const result = JSON.parse(text);
      if (result.success) {
        console.log('\n✅ Branch created successfully on server!');
        
        // Update localStorage
        const existing = JSON.parse(localStorage.getItem('branches') || '[]');
        existing.push(result.data);
        localStorage.setItem('branches', JSON.stringify(existing));
        console.log('✅ Updated localStorage');
        
        // Trigger reload
        window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
        console.log('✅ Triggered reload event');
        
        console.log('\n💡 Refresh the page to see the branch!');
        console.log('💡 Then refresh System B - it should also show this branch!');
      } else {
        console.error('\n❌ Failed:', result.error);
      }
    } catch (e) {
      console.error('Response is not JSON:', text);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
