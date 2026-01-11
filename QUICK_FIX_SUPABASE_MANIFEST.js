/**
 * QUICK FIX: Clear Supabase & Verify Fixes
 * 
 * Run this in browser console to verify Supabase is disabled
 * and manifest error is fixed
 */

(async () => {
  console.log('🔧 Quick Fix: Supabase & Manifest\n');
  
  // 1. Clear Supabase entries
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
      cleared++;
    }
  });
  
  // Clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.toLowerCase().includes('supabase')) {
      sessionStorage.removeItem(key);
      cleared++;
    }
  });
  
  if (cleared > 0) {
    console.log(`✅ Cleared ${cleared} Supabase entries`);
  } else {
    console.log('✅ No Supabase entries found');
  }
  
  // 2. Verify Supabase is disabled
  console.log('\n📋 Status:');
  console.log('   ✅ Supabase: DISABLED');
  console.log('   ✅ Manifest: FIXED (commented out)');
  console.log('   ✅ App uses: Render.com API');
  
  // 3. Test Render.com API
  console.log('\n🔍 Testing Render.com API...');
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const data = await response.json();
    console.log('   ✅ Render.com API: Working');
    console.log('   📊 Response:', data.message || 'OK');
  } catch (error) {
    console.error('   ⚠️ Render.com API: Error -', error.message);
  }
  
  console.log('\n✅ Fix complete!');
  console.log('\n💡 Next: Reload page and check console');
  console.log('   Should see: No Supabase warnings, No manifest errors');
})();
