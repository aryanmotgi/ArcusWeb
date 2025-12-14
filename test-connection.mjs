// Test Supabase edge function connection
// Run with: node test-connection.mjs

import { readFileSync } from 'fs';

console.log('🔍 Testing Supabase Connection...\n');

// Load environment variables from .env
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log(`  URL: ${SUPABASE_URL}`);
console.log(`  Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log();

// Test 1: Health check
console.log('Test 1: Edge Function Health Check');
try {
  const healthResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/make-server-13c7a257/health`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (healthResponse.ok) {
    const data = await healthResponse.json();
    console.log('✅ Health check passed:', data);
  } else {
    console.log('⚠️  Health check returned status:', healthResponse.status);
  }
} catch (error) {
  console.error('❌ Health check failed:', error.message);
}

console.log();

// Test 2: Get waitlist entries
console.log('Test 2: Fetching Waitlist Entries');
try {
  const waitlistResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/make-server-13c7a257/waitlist`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (waitlistResponse.ok) {
    const data = await waitlistResponse.json();
    console.log('✅ Waitlist query successful');
    console.log(`   Total entries: ${data.count || 0}`);
    if (data.contacts && data.contacts.length > 0) {
      console.log('   Sample entries:');
      data.contacts.slice(0, 3).forEach((entry, i) => {
        console.log(`     ${i + 1}. Email: ${entry.email || 'N/A'}, Phone: ${entry.phone || 'N/A'}`);
      });
    }
  } else {
    console.log('⚠️  Waitlist query returned status:', waitlistResponse.status);
    const errorData = await waitlistResponse.text();
    console.log('   Response:', errorData);
  }
} catch (error) {
  console.error('❌ Waitlist query failed:', error.message);
}

console.log();
console.log('✅ Connection tests complete!');
console.log('\nNext steps:');
console.log('1. Sign up for Resend at https://resend.com');
console.log('2. Sign up for Twilio at https://www.twilio.com');
console.log('3. Add API credentials to .env file');
console.log('4. Implement messaging functions in edge function');
