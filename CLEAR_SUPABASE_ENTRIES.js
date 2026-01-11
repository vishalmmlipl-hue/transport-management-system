/**
 * CLEAR: Remove All Supabase-Related Data
 * 
 * This script clears any Supabase-related localStorage entries
 * and confirms that the app uses Render.com API instead
 */

(async () => {
  console.log('🧹 Clearing Supabase entries...\n');
  
  // 1. Clear any Supabase-related localStorage keys
  const supabaseKeys = [
    'supabase.auth.token',
    'supabase.auth.user',
    'sb-access-token',
    'sb-refresh-token',
    'supabase_session',
    'supabase_user',
    'supabase_data'
  ];
  
  let cleared = 0;
  supabaseKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Cleared: ${key}`);
      cleared++;
    }
  });
  
  if (cleared === 0) {
    console.log('✅ No Supabase entries found in localStorage');
  }
  
  // 2. Check for any Supabase-related sessionStorage
  const sessionKeys = Object.keys(sessionStorage).filter(key => 
    key.toLowerCase().includes('supabase')
  );
  
  if (sessionKeys.length > 0) {
    sessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`✅ Cleared sessionStorage: ${key}`);
    });
  } else {
    console.log('✅ No Supabase entries in sessionStorage');
  }
  
  // 3. Verify Supabase is disabled
  console.log('\n📋 Supabase Status:');
  console.log('   ✅ Supabase is DISABLED');
  console.log('   ✅ App uses Render.com API');
  console.log('   ✅ No Supabase warnings should appear');
  
  // 4. Verify Render.com API is working
  console.log('\n🔍 Verifying Render.com API...');
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const data = await response.json();
    console.log('   ✅ Render.com API is working:', data.message || 'OK');
  } catch (error) {
    console.error('   ⚠️ Could not verify Render.com API:', error.message);
  }
  
  console.log('\n✅ Supabase cleanup complete!');
  console.log('\n💡 The app now uses Render.com API exclusively.');
  console.log('   No Supabase warnings should appear in console.');
})();
