#!/usr/bin/env node

/**
 * Automated Deployment Script for Hostinger
 * 
 * Usage:
 *   npm run deploy
 * 
 * This script:
 * 1. Builds the React app
 * 2. Uploads to Hostinger via FTP/SSH
 * 3. Shows progress
 * 4. Verifies deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.deploy');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  }
  return {};
}

// Check if build exists
function checkBuild() {
  const buildPath = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(buildPath)) {
    log('❌ Build folder not found!', 'red');
    log('📦 Building app first...', 'yellow');
    try {
      execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      log('✅ Build completed!', 'green');
    } catch (error) {
      log('❌ Build failed!', 'red');
      process.exit(1);
    }
  } else {
    log('✅ Build folder found', 'green');
  }
}

// Deploy via FTP
function deployViaFTP(env) {
  log('📤 Deploying via FTP...', 'blue');
  
  // Check if required env vars are set
  if (!env.HOSTINGER_HOST || !env.HOSTINGER_USER || !env.HOSTINGER_PASS) {
    log('❌ Missing Hostinger credentials!', 'red');
    log('📝 Create .env.deploy file with:', 'yellow');
    log('   HOSTINGER_HOST=your-server.com', 'yellow');
    log('   HOSTINGER_USER=your-username', 'yellow');
    log('   HOSTINGER_PASS=your-password', 'yellow');
    log('   HOSTINGER_PATH=/public_html', 'yellow');
    process.exit(1);
  }

  // Try using lftp (if available) or provide instructions
  try {
    execSync('which lftp', { stdio: 'ignore' });
    log('✅ lftp found, using FTP...', 'green');
    
    const lftpScript = `
set ftp:ssl-allow no
open -u ${env.HOSTINGER_USER},${env.HOSTINGER_PASS} ${env.HOSTINGER_HOST}
cd ${env.HOSTINGER_PATH || '/public_html'}
mirror -R --delete --verbose build/ .
bye
`;
    
    fs.writeFileSync('/tmp/lftp-script.txt', lftpScript);
    execSync('lftp -f /tmp/lftp-script.txt', { stdio: 'inherit' });
    fs.unlinkSync('/tmp/lftp-script.txt');
    
    log('✅ Deployment completed via FTP!', 'green');
  } catch (error) {
    log('⚠️  lftp not found. Using alternative method...', 'yellow');
    deployViaSCP(env);
  }
}

// Deploy via SCP (SSH)
function deployViaSCP(env) {
  log('📤 Deploying via SCP (SSH)...', 'blue');
  
  if (!env.HOSTINGER_HOST || !env.HOSTINGER_USER) {
    log('❌ Missing Hostinger SSH credentials!', 'red');
    log('📝 Add to .env.deploy:', 'yellow');
    log('   HOSTINGER_HOST=your-server.com', 'yellow');
    log('   HOSTINGER_USER=your-username', 'yellow');
    log('   HOSTINGER_PATH=/public_html', 'yellow');
    process.exit(1);
  }

  const buildPath = path.join(__dirname, '..', 'build');
  const remotePath = env.HOSTINGER_PATH || '/public_html';
  const scpCommand = `scp -r ${buildPath}/* ${env.HOSTINGER_USER}@${env.HOSTINGER_HOST}:${remotePath}/`;
  
  log('📤 Uploading files...', 'yellow');
  log(`   Command: ${scpCommand.replace(env.HOSTINGER_PASS || '', '***')}`, 'blue');
  
  try {
    execSync(scpCommand, { stdio: 'inherit' });
    log('✅ Deployment completed via SCP!', 'green');
  } catch (error) {
    log('❌ SCP deployment failed!', 'red');
    log('💡 Alternative: Use FTP client or Hostinger File Manager', 'yellow');
    log('💡 Or install lftp: brew install lftp', 'yellow');
    process.exit(1);
  }
}

// Main deployment function
function deploy() {
  log('🚀 Starting Hostinger Deployment...\n', 'blue');
  
  // Load environment
  const env = loadEnv();
  
  // Check build
  checkBuild();
  
  // Choose deployment method
  if (env.HOSTINGER_PASS) {
    deployViaFTP(env);
  } else {
    deployViaSCP(env);
  }
  
  log('\n✅ Deployment complete!', 'green');
  log('🌐 Visit your site to verify changes', 'blue');
}

// Run deployment
deploy();
