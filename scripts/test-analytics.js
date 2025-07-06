#!/usr/bin/env node

/**
 * Quick test script for analytics functionality
 * Run with: node scripts/test-analytics.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3456';
const isHTTPS = BASE_URL.startsWith('https');
const client = isHTTPS ? https : http;

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHTTPS ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testGA4API() {
  log('\n=== Testing GA4 API Configuration ===', 'blue');
  
  try {
    const response = await makeRequest('/api/analytics/ga4/test');
    
    if (response.status === 200 && response.data.configured) {
      log('✓ GA4 API is configured', 'green');
      log(`  Property ID: ${response.data.propertyId}`);
      log(`  Service Account: ${response.data.hasServiceAccount ? 'Yes' : 'No'}`);
      
      if (response.data.data) {
        log(`  Active Users: ${response.data.data.activeUsers}`);
      }
    } else {
      log('✗ GA4 API is not configured', 'red');
      log(`  ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    log('✗ Failed to test GA4 API', 'red');
    log(`  ${error.message}`);
  }
}

async function testServerAnalytics() {
  log('\n=== Testing Server-side Analytics ===', 'blue');
  
  try {
    const response = await makeRequest('/api/analytics/server/test');
    
    if (response.status === 200 && response.data.configured) {
      log('✓ Server analytics is configured', 'green');
      log('  Test events sent:');
      response.data.events.forEach(event => {
        log(`    - ${event.type}: ${event.details}`);
      });
      log(`  Note: ${response.data.note}`, 'yellow');
    } else {
      log('✗ Server analytics is not configured', 'red');
      log(`  ${response.data.message || 'Unknown error'}`);
      
      if (response.data.required) {
        log('\n  Required environment variables:', 'yellow');
        Object.entries(response.data.required).forEach(([key, desc]) => {
          log(`    ${key}: ${desc}`);
        });
      }
    }
  } catch (error) {
    log('✗ Failed to test server analytics', 'red');
    log(`  ${error.message}`);
  }
}

async function testCustomEvent() {
  log('\n=== Testing Custom Event Tracking ===', 'blue');
  
  try {
    const testEvent = {
      eventName: 'test_script_event',
      parameters: {
        test_id: Date.now(),
        test_type: 'automated',
        environment: 'development'
      },
      userId: 'test-script-user'
    };
    
    const response = await makeRequest('/api/analytics/server/test', {
      method: 'POST',
      body: testEvent
    });
    
    if (response.status === 200 && response.data.success) {
      log('✓ Custom event tracked successfully', 'green');
      log(`  Event: ${response.data.event.name}`);
      log(`  Parameters: ${JSON.stringify(response.data.event.parameters)}`);
    } else {
      log('✗ Failed to track custom event', 'red');
      log(`  ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log('✗ Failed to test custom event', 'red');
    log(`  ${error.message}`);
  }
}

async function checkEnvironmentVariables() {
  log('\n=== Checking Environment Variables ===', 'blue');
  
  const required = [
    'GA4_PROPERTY_ID',
    'GA4_MEASUREMENT_ID',
    'GA4_API_SECRET'
  ];
  
  const optional = [
    'GA4_SERVICE_ACCOUNT_KEY'
  ];
  
  // Note: We can't directly check env vars from client-side script
  // This is just a reminder
  log('Please ensure these environment variables are set in .env.local:', 'yellow');
  
  log('\nRequired:');
  required.forEach(key => {
    log(`  ${key}`);
  });
  
  log('\nOptional but recommended:');
  optional.forEach(key => {
    log(`  ${key}`);
  });
}

async function main() {
  log('🚀 Analytics Test Suite', 'blue');
  log(`Testing against: ${BASE_URL}`, 'yellow');
  
  await checkEnvironmentVariables();
  await testGA4API();
  await testServerAnalytics();
  await testCustomEvent();
  
  log('\n=== Test Complete ===', 'blue');
  log('\nNext steps:', 'yellow');
  log('1. Check Google Analytics 4 > Real-time reports');
  log('2. Enable DebugView in GA4 for detailed event inspection');
  log('3. Visit http://localhost:3000/admin/analytics to see the dashboard');
  log('4. Try the interactive features listed in test-new-features.md');
}

// Run the tests
main().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});