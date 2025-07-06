#!/usr/bin/env node

/**
 * Script to fix GA4 configuration issues:
 * 1. Properly stringify service account JSON
 * 2. Show how to fix user_id reserved property issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 GA4 Configuration Fix Helper\n');

// Read the service account JSON
const serviceAccountPath = path.join(__dirname, '..', '..', 'dentistryexplained-3f035ee170b8.json');

try {
  const serviceAccountJSON = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountJSON);
  
  // Stringify the JSON properly for .env.local
  const stringified = JSON.stringify(serviceAccount);
  
  console.log('1️⃣ Service Account JSON Fix:');
  console.log('Add this to your .env.local file:\n');
  console.log(`GA4_SERVICE_ACCOUNT_KEY='${stringified}'`);
  console.log('\n(Note: Use single quotes to wrap the stringified JSON)');
  
} catch (error) {
  console.error('❌ Error reading service account JSON:', error.message);
}

console.log('\n' + '='.repeat(80) + '\n');

console.log('2️⃣ User ID Reserved Property Fix:\n');
console.log('The issue: GA4 reserves "user_id" as a built-in parameter.');
console.log('We\'re sending it as a user property, which causes the NAME_RESERVED error.\n');

console.log('Solution: We need to update the analytics-server.ts file.');
console.log('Instead of sending user_id in user_properties, we should:');
console.log('- Remove user_id from ServerUserProperties interface');
console.log('- Use a different property name like "app_user_id" or "internal_user_id"');
console.log('- The user_id parameter at the top level of the payload is correct and should stay\n');

console.log('Here\'s what needs to change in lib/analytics-server.ts:\n');

console.log(`// Change this:
interface ServerUserProperties {
  user_id?: string;  // ❌ This is reserved
  user_type?: 'patient' | 'professional' | 'admin';
  is_verified?: boolean;
  email_hash?: string;
  [key: string]: string | number | boolean | undefined;
}

// To this:
interface ServerUserProperties {
  app_user_id?: string;  // ✅ Use a custom name
  user_type?: 'patient' | 'professional' | 'admin';
  is_verified?: boolean;
  email_hash?: string;
  [key: string]: string | number | boolean | undefined;
}`);

console.log('\n' + '='.repeat(80) + '\n');

console.log('3️⃣ Summary of GA4 Reserved Properties:\n');
console.log('These cannot be used as custom user properties:');
console.log('- user_id');
console.log('- user_pseudo_id');
console.log('- first_open_time');
console.log('- first_visit_time');
console.log('- last_deep_link_referrer');
console.log('- user_ltv');
console.log('- device');
console.log('- geo');
console.log('- app_info');
console.log('- traffic_source');
console.log('- stream_id');
console.log('- platform');
console.log('- event_');

console.log('\n✅ Action Items:');
console.log('1. Copy the GA4_SERVICE_ACCOUNT_KEY value above to your .env.local');
console.log('2. Update the ServerUserProperties interface to use app_user_id');
console.log('3. Update all code that passes user_id as a user property');
console.log('4. Restart the dev server after making these changes');