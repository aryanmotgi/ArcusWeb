// Simple test script to verify Supabase connection
// Run with: node test-supabase-connection.js

import { createClient } from '@jsr/supabase__supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...\n');

// Check if credentials are loaded
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log(`  URL: ${SUPABASE_URL}`);
console.log(`  Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log();

try {
  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✓ Supabase client created');

  // Test connection by querying the waitlist table
  console.log('\nTesting database connection...');
  const { data, error, count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('❌ Database query failed:', error.message);
    process.exit(1);
  }

  console.log('✓ Successfully connected to Supabase database');
  console.log(`\n📊 Waitlist table status:`);
  console.log(`  Total entries: ${count}`);
  console.log(`  Sample entries (first 5):`);

  if (data && data.length > 0) {
    data.forEach((entry, index) => {
      console.log(`    ${index + 1}. Email: ${entry.email || 'N/A'}, Phone: ${entry.phone || 'N/A'}, Source: ${entry.source}`);
    });
  } else {
    console.log('    (No entries found)');
  }

  console.log('\n✅ Connection test successful!');
  console.log('\nYou can now proceed with implementing the messaging features.');

} catch (err) {
  console.error('❌ Connection test failed:', err.message);
  process.exit(1);
}
