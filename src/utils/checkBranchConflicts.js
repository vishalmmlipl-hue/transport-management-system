/**
 * Check for conflicts between localStorage and Render.com API
 * Run this in browser console to detect and fix conflicts
 */

const checkBranchConflicts = async () => {
  console.log('🔍 Checking for branch data conflicts...\n');
  
  // Get localStorage data
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`📦 localStorage has ${localBranches.length} branches`);
  
  // Get server data
  let serverBranches = [];
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const result = await response.json();
    serverBranches = result.data || [];
    console.log(`🌐 Server has ${serverBranches.length} branches`);
  } catch (error) {
    console.error('❌ Error fetching from server:', error);
    return;
  }
  
  // Check for duplicates
  const localIds = new Set(localBranches.map(b => b.id));
  const serverIds = new Set(serverBranches.map(b => b.id));
  const localCodes = new Set(localBranches.map(b => b.branchCode?.toUpperCase()));
  const serverCodes = new Set(serverBranches.map(b => b.branchCode?.toUpperCase()));
  
  // Find conflicts
  const conflicts = {
    duplicateIds: [],
    duplicateCodes: [],
    onlyInLocal: [],
    onlyInServer: [],
    differentData: []
  };
  
  // Check for duplicate IDs
  localBranches.forEach(local => {
    if (serverIds.has(local.id)) {
      const server = serverBranches.find(s => s.id === local.id);
      if (JSON.stringify(local) !== JSON.stringify(server)) {
        conflicts.differentData.push({
          id: local.id,
          branchCode: local.branchCode,
          local,
          server
        });
      }
    } else {
      conflicts.onlyInLocal.push(local);
    }
  });
  
  // Check for branches only in server
  serverBranches.forEach(server => {
    if (!localIds.has(server.id)) {
      conflicts.onlyInServer.push(server);
    }
  });
  
  // Check for duplicate branch codes
  localBranches.forEach(local => {
    const code = local.branchCode?.toUpperCase();
    if (code && serverCodes.has(code)) {
      const server = serverBranches.find(s => s.branchCode?.toUpperCase() === code);
      if (server && server.id !== local.id) {
        conflicts.duplicateCodes.push({
          local,
          server
        });
      }
    }
  });
  
  // Report conflicts
  console.log('\n📊 Conflict Analysis:');
  console.log(`  - Branches only in localStorage: ${conflicts.onlyInLocal.length}`);
  console.log(`  - Branches only in server: ${conflicts.onlyInServer.length}`);
  console.log(`  - Branches with same ID but different data: ${conflicts.differentData.length}`);
  console.log(`  - Duplicate branch codes: ${conflicts.duplicateCodes.length}`);
  
  if (conflicts.onlyInLocal.length > 0) {
    console.log('\n⚠️ Branches only in localStorage (not on server):');
    conflicts.onlyInLocal.forEach(b => {
      console.log(`  - ${b.branchName} (${b.branchCode}) - ID: ${b.id}`);
    });
  }
  
  if (conflicts.onlyInServer.length > 0) {
    console.log('\n✅ Branches only on server (not in localStorage):');
    conflicts.onlyInServer.forEach(b => {
      console.log(`  - ${b.branchName} (${b.branchCode}) - ID: ${b.id}`);
    });
  }
  
  if (conflicts.differentData.length > 0) {
    console.log('\n⚠️ Branches with same ID but different data:');
    conflicts.differentData.forEach(({ id, branchCode, local, server }) => {
      console.log(`  - ${branchCode} (ID: ${id})`);
      console.log(`    Local: ${JSON.stringify(local).substring(0, 100)}...`);
      console.log(`    Server: ${JSON.stringify(server).substring(0, 100)}...`);
    });
  }
  
  if (conflicts.duplicateCodes.length > 0) {
    console.log('\n⚠️ Duplicate branch codes (different IDs):');
    conflicts.duplicateCodes.forEach(({ local, server }) => {
      console.log(`  - Code: ${local.branchCode}`);
      console.log(`    Local ID: ${local.id}, Server ID: ${server.id}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (conflicts.onlyInLocal.length > 0 || conflicts.differentData.length > 0) {
    console.log('  1. Clear localStorage branches and reload from server');
    console.log('  2. Or migrate local-only branches to server');
  }
  if (conflicts.duplicateCodes.length > 0) {
    console.log('  3. Fix duplicate branch codes - each code should be unique');
  }
  if (conflicts.onlyInServer.length > 0) {
    console.log('  4. Server has newer data - localStorage will be updated on next load');
  }
  
  return conflicts;
};

// Function to fix conflicts by syncing with server
const fixBranchConflicts = async () => {
  console.log('🔧 Fixing branch conflicts...\n');
  
  try {
    // Get fresh data from server
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const result = await response.json();
    const serverBranches = result.data || [];
    
    // Replace localStorage with server data
    localStorage.setItem('branches', JSON.stringify(serverBranches));
    
    console.log(`✅ Updated localStorage with ${serverBranches.length} branches from server`);
    console.log('✅ All conflicts resolved - localStorage now matches server');
    
    // Trigger reload event
    window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    
    return true;
  } catch (error) {
    console.error('❌ Error fixing conflicts:', error);
    return false;
  }
};

// Export for use in console
if (typeof window !== 'undefined') {
  window.checkBranchConflicts = checkBranchConflicts;
  window.fixBranchConflicts = fixBranchConflicts;
  console.log('✅ Conflict check functions available:');
  console.log('  - checkBranchConflicts() - Check for conflicts');
  console.log('  - fixBranchConflicts() - Fix conflicts by syncing with server');
}

export { checkBranchConflicts, fixBranchConflicts };
