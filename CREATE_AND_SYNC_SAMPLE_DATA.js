// Create and Sync Sample Data to Server
// This will create sample data and sync it to the server so all systems can see it

(async () => {
  console.log('📦 Creating Sample Data for All Systems...\n');
  
  // Sample Branches
  const sampleBranches = [
    {
      branchName: 'Mumbai Head Office',
      branchCode: 'MUM001',
      address: '123 Business Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '022-12345678',
      email: 'mumbai@company.com',
      status: 'Active',
      lrSeriesStart: '1000000001',
      lrSeriesEnd: '1999999999',
      lrSeriesCurrent: '1000000001',
      lrPrefix: 'MUM'
    },
    {
      branchName: 'Delhi Branch',
      branchCode: 'DEL001',
      address: '456 Trade Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      phone: '011-23456789',
      email: 'delhi@company.com',
      status: 'Active',
      lrSeriesStart: '2000000001',
      lrSeriesEnd: '2999999999',
      lrSeriesCurrent: '2000000001',
      lrPrefix: 'DEL'
    },
    {
      branchName: 'Bangalore Branch',
      branchCode: 'BLR001',
      address: '789 Tech Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phone: '080-34567890',
      email: 'bangalore@company.com',
      status: 'Active',
      lrSeriesStart: '3000000001',
      lrSeriesEnd: '3999999999',
      lrSeriesCurrent: '3000000001',
      lrPrefix: 'BLR'
    }
  ];
  
  // Sample Cities
  const sampleCities = [
    { code: 'MUM', cityName: 'Mumbai', state: 'Maharashtra', region: 'West', zone: 'West', status: 'Active' },
    { code: 'DEL', cityName: 'Delhi', state: 'Delhi', region: 'North', zone: 'North', status: 'Active' },
    { code: 'BLR', cityName: 'Bangalore', state: 'Karnataka', region: 'South', zone: 'South', status: 'Active' },
    { code: 'CHN', cityName: 'Chennai', state: 'Tamil Nadu', region: 'South', zone: 'South', status: 'Active' },
    { code: 'KOL', cityName: 'Kolkata', state: 'West Bengal', region: 'East', zone: 'East', status: 'Active' }
  ];
  
  // Sample Vehicles
  const sampleVehicles = [
    { vehicleNumber: 'MH01AB1234', vehicleType: 'Truck', ownerName: 'Transport Co', ownerMobile: '9876543210', status: 'Active' },
    { vehicleNumber: 'DL02CD5678', vehicleType: 'Truck', ownerName: 'Logistics Ltd', ownerMobile: '9876543211', status: 'Active' },
    { vehicleNumber: 'KA03EF9012', vehicleType: 'Truck', ownerName: 'Freight Services', ownerMobile: '9876543212', status: 'Active' }
  ];
  
  // Sample Drivers
  const sampleDrivers = [
    { driverName: 'Rajesh Kumar', licenseNumber: 'DL1234567890', mobile: '9876543210', status: 'Active' },
    { driverName: 'Suresh Singh', licenseNumber: 'MH1234567891', mobile: '9876543211', status: 'Active' },
    { driverName: 'Mahesh Patel', licenseNumber: 'KA1234567892', mobile: '9876543212', status: 'Active' }
  ];
  
  // Sync Branches
  console.log('1️⃣ Syncing Branches...');
  let branchesSynced = 0;
  for (let i = 0; i < sampleBranches.length; i++) {
    const branch = sampleBranches[i];
    try {
      const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch)
      });
      const result = await response.json();
      if (result.success) {
        branchesSynced++;
        console.log(`   ✅ ${branch.branchName}`);
      } else {
        console.error(`   ❌ ${branch.branchName}:`, result.error || 'Failed');
      }
    } catch (error) {
      console.error(`   ❌ ${branch.branchName}:`, error.message);
    }
  }
  
  // Sync Cities
  console.log('\n2️⃣ Syncing Cities...');
  let citiesSynced = 0;
  for (let i = 0; i < sampleCities.length; i++) {
    const city = sampleCities[i];
    try {
      const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(city)
      });
      const result = await response.json();
      if (result.success) {
        citiesSynced++;
        console.log(`   ✅ ${city.cityName}`);
      }
    } catch (error) {
      console.error(`   ❌ ${city.cityName}`);
    }
  }
  
  // Sync Vehicles
  console.log('\n3️⃣ Syncing Vehicles...');
  let vehiclesSynced = 0;
  for (let i = 0; i < sampleVehicles.length; i++) {
    const vehicle = sampleVehicles[i];
    try {
      const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle)
      });
      const result = await response.json();
      if (result.success) {
        vehiclesSynced++;
        console.log(`   ✅ ${vehicle.vehicleNumber}`);
      }
    } catch (error) {
      console.error(`   ❌ ${vehicle.vehicleNumber}`);
    }
  }
  
  // Sync Drivers
  console.log('\n4️⃣ Syncing Drivers...');
  let driversSynced = 0;
  for (let i = 0; i < sampleDrivers.length; i++) {
    const driver = sampleDrivers[i];
    try {
      const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driver)
      });
      const result = await response.json();
      if (result.success) {
        driversSynced++;
        console.log(`   ✅ ${driver.driverName}`);
      }
    } catch (error) {
      console.error(`   ❌ ${driver.driverName}`);
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   ✅ Branches: ${branchesSynced}/${sampleBranches.length}`);
  console.log(`   ✅ Cities: ${citiesSynced}/${sampleCities.length}`);
  console.log(`   ✅ Vehicles: ${vehiclesSynced}/${sampleVehicles.length}`);
  console.log(`   ✅ Drivers: ${driversSynced}/${sampleDrivers.length}`);
  
  // Verify
  const verifyBranches = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verifyBranches.json();
  console.log(`\n✅ Server now has: ${verifyData.data.length} branches`);
  
  console.log('\n💡 Refresh both systems to see the data!');
  console.log('💡 All systems will now see the same data from the server!');
})();
