/**
 * Quick script to check Hedera configuration
 * Run: npx tsx scripts/check-hedera-config.ts
 */

import * as dotenv from 'dotenv';

dotenv.config();

console.log('\n🔍 Checking Hedera Configuration...\n');

const checks = [
  {
    name: 'HEDERA_OPERATOR_ID',
    value: process.env.HEDERA_OPERATOR_ID,
    required: true,
    example: '0.0.123456'
  },
  {
    name: 'HEDERA_OPERATOR_KEY',
    value: process.env.HEDERA_OPERATOR_KEY,
    required: true,
    example: '302e020100300506032b657004220420...'
  },
  {
    name: 'SOUL_NFT_TOKEN_ID',
    value: process.env.SOUL_NFT_TOKEN_ID,
    required: true,
    example: '0.0.7223283'
  },
  {
    name: 'EVOLUTION_TOPIC_ID',
    value: process.env.EVOLUTION_TOPIC_ID,
    required: false,
    example: '0.0.123456'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    required: false,
    example: 'https://xxx.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    required: false,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'GROQ_API_KEY',
    value: process.env.GROQ_API_KEY,
    required: false,
    example: 'gsk_...'
  }
];

let hasErrors = false;
let hasWarnings = false;

checks.forEach(check => {
  const isSet = !!check.value && check.value.length > 0;
  const status = isSet ? '✅' : (check.required ? '❌' : '⚠️');
  
  console.log(`${status} ${check.name}`);
  
  if (isSet && check.value) {
    // Show first and last few characters
    const masked = check.value.length > 20
      ? `${check.value.substring(0, 10)}...${check.value.substring(check.value.length - 6)}`
      : check.value;
    console.log(`   Value: ${masked}`);
  } else {
    if (check.required) {
      console.log(`   ❌ MISSING (Required!)`);
      console.log(`   Example: ${check.example}`);
      hasErrors = true;
    } else {
      console.log(`   ⚠️  Not set (Optional)`);
      console.log(`   Example: ${check.example}`);
      hasWarnings = true;
    }
  }
  console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (hasErrors) {
  console.log('❌ CONFIGURATION ERRORS FOUND!');
  console.log('');
  console.log('Required environment variables are missing.');
  console.log('Please add them to your .env file.\n');
  console.log('Steps:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Fill in your Hedera credentials');
  console.log('3. Restart your development server\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS:');
  console.log('Some optional features are not configured.');
  console.log('The app will work but with limited functionality.\n');
} else {
  console.log('✅ ALL CONFIGURATIONS OK!');
  console.log('Your Hedera setup is ready to go!\n');
}
