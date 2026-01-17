/**
 * Test script for Driver License API
 * Run: node test-license-api.js
 */

const https = require('https');
const url = require('url');

const licenseApiUrl = 'https://sandbox.api-setu.in/certificate/v3/transport/drvlc';
const apiKey = 'demokey123456ABCD789';
const clientId = 'in.gov.sandbox';

// Test data
const testPayload = {
  txnId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  format: 'json',
  certificateParameters: {
    dlno: 'MP4120131062332',
    UID: '',
    FullName: 'Test User',
    DOB: '25-10-1988'
  },
  consentArtifact: {
    consent: {
      consentId: `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      dataConsumer: {
        id: 'tms-driver-verification'
      },
      dataProvider: {
        id: 'rto-india'
      },
      purpose: {
        description: 'Driver license verification for employment'
      },
      user: {
        idType: 'DL',
        idNumber: 'MP4120131062332',
        mobile: '9988776655',
        email: 'test@email.com'
      },
      data: {
        id: 'driver-license'
      },
      permission: {
        access: 'read',
        dateRange: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        frequency: {
          unit: 'once',
          value: 1,
          repeats: 0
        }
      }
    },
    signature: {
      signature: Buffer.from(JSON.stringify({ consentId: 'test', timestamp: new Date().toISOString() })).toString('base64')
    }
  }
};

const requestData = JSON.stringify(testPayload);
const parsedUrl = new url.URL(licenseApiUrl);

const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || 443,
  path: parsedUrl.pathname,
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-APISETU-APIKEY': apiKey,
    'X-APISETU-CLIENTID': clientId,
    'Content-Length': Buffer.byteLength(requestData)
  }
};

console.log('🔍 Testing API Setu Driver License API...');
console.log('📋 License Number:', testPayload.certificateParameters.dlno);
console.log('📅 DOB:', testPayload.certificateParameters.DOB);
console.log('🌐 Endpoint:', licenseApiUrl);
console.log('');

const req = https.request(options, (res) => {
  let responseData = '';
  
  console.log(`📥 Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers:`, res.headers);
  console.log('');
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response Body:');
    console.log(responseData);
    console.log('');
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const data = JSON.parse(responseData);
        console.log('✅ Success! Parsed JSON:');
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('⚠️ Response is not JSON, raw data shown above');
      }
    } else {
      console.error(`❌ API returned error status: ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.error('Full error:', error);
});

req.setTimeout(30000, () => {
  req.destroy();
  console.error('❌ Request timeout');
});

req.write(requestData);
req.end();
