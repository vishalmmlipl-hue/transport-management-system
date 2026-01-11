/**
 * QUICK FIX: Check Why mmlipl.info is Not Working
 * 
 * Run this in browser console on mmlipl.info to diagnose
 */

(async () => {
  console.log('🔍 Diagnosing mmlipl.info issues...\n');
  
  // 1. Check if page loaded
  console.log('1️⃣ Page Status:');
  console.log('   URL:', window.location.href);
  console.log('   Title:', document.title);
  console.log('   Root element:', document.getElementById('root') ? '✅ Found' : '❌ Missing');
  
  // 2. Check for React errors
  console.log('\n2️⃣ React Status:');
  const root = document.getElementById('root');
  if (root) {
    console.log('   Root has children:', root.children.length);
    if (root.children.length === 0) {
      console.log('   ⚠️ Root is empty - React may not have rendered');
    }
  }
  
  // 3. Check console errors
  console.log('\n3️⃣ Check Console Tab:');
  console.log('   Look for red error messages above');
  console.log('   Common errors:');
  console.log('     - Module not found');
  console.log('     - Cannot read property');
  console.log('     - Import errors');
  
  // 4. Check Network tab
  console.log('\n4️⃣ Check Network Tab:');
  console.log('   Look for failed requests (red)');
  console.log('   Common issues:');
  console.log('     - 404: main.js not found');
  console.log('     - 404: main.css not found');
  console.log('     - CORS errors');
  
  // 5. Test API connection
  console.log('\n5️⃣ Testing API Connection...');
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const data = await response.json();
    console.log('   ✅ API is working:', data.message || 'OK');
  } catch (error) {
    console.error('   ❌ API error:', error.message);
  }
  
  // 6. Check localStorage
  console.log('\n6️⃣ Checking localStorage...');
  const keys = Object.keys(localStorage);
  console.log('   localStorage keys:', keys.length);
  if (keys.length > 0) {
    console.log('   Keys:', keys.slice(0, 10));
  }
  
  // 7. Recommendations
  console.log('\n💡 Recommendations:');
  console.log('   1. Check Netlify Dashboard → Deploys → Latest deploy');
  console.log('   2. Check if build succeeded');
  console.log('   3. Check browser console for errors (red messages)');
  console.log('   4. Try hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
  console.log('   5. Try incognito/private mode');
  
  console.log('\n✅ Diagnosis complete!');
  console.log('   Share the errors you see in console for specific help.');
})();
