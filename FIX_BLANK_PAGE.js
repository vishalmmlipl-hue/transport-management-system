/**
 * FIX: Blank Page Diagnosis
 * 
 * Run this in browser console on mmlipl.info to diagnose blank page
 */

(async () => {
  console.log('🔍 Diagnosing blank page...\n');
  
  // 1. Check root element
  console.log('1️⃣ Checking root element...');
  const root = document.getElementById('root');
  if (root) {
    console.log('   ✅ Root element found');
    console.log('   Children:', root.children.length);
    console.log('   InnerHTML length:', root.innerHTML.length);
    
    if (root.children.length === 0 && root.innerHTML.length < 100) {
      console.log('   ⚠️ Root is empty - React may not have rendered');
    }
  } else {
    console.error('   ❌ Root element NOT found!');
    console.log('   This means index.html is missing <div id="root"></div>');
  }
  
  // 2. Check for React errors
  console.log('\n2️⃣ Checking for React errors...');
  console.log('   Look at console above for:');
  console.log('     - "Uncaught Error"');
  console.log('     - "Cannot read property"');
  console.log('     - "Module not found"');
  console.log('     - "Import error"');
  
  // 3. Check Network tab
  console.log('\n3️⃣ Check Network Tab:');
  console.log('   Look for failed requests (red):');
  console.log('     - main.xxx.js (404 = not found)');
  console.log('     - main.xxx.css (404 = not found)');
  console.log('     - index.html (should be 200)');
  
  // 4. Check if React is loaded
  console.log('\n4️⃣ Checking React...');
  if (window.React) {
    console.log('   ✅ React is loaded');
  } else {
    console.log('   ⚠️ React not found in window object');
  }
  
  // 5. Check for build errors
  console.log('\n5️⃣ Check Netlify Build:');
  console.log('   Go to: https://app.netlify.com');
  console.log('   Click your site → Deploys tab');
  console.log('   Check if latest deploy succeeded (green checkmark)');
  console.log('   If red X, click it to see build errors');
  
  // 6. Test API
  console.log('\n6️⃣ Testing API...');
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const data = await response.json();
    console.log('   ✅ API is working:', data.message || 'OK');
  } catch (error) {
    console.error('   ❌ API error:', error.message);
  }
  
  // 7. Recommendations
  console.log('\n💡 Most Likely Causes:');
  console.log('   1. Build failed on Netlify (check Deploys tab)');
  console.log('   2. JavaScript error preventing render (check console)');
  console.log('   3. Missing files (check Network tab)');
  console.log('   4. Import error (check console)');
  
  console.log('\n🔧 Quick Fixes:');
  console.log('   1. Check Netlify build logs');
  console.log('   2. Hard refresh: Ctrl+F5 or Cmd+Shift+R');
  console.log('   3. Clear cache and reload');
  console.log('   4. Try incognito/private mode');
  
  console.log('\n✅ Diagnosis complete!');
  console.log('   Share the errors you see in console for specific help.');
})();
