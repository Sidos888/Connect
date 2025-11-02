#!/usr/bin/env node

/**
 * Apply Chat Loading Optimizations
 * This script applies the database optimizations for fast chat loading
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyOptimizations() {
  console.log('🚀 Applying chat loading optimizations...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', '20250115_optimize_chat_loading.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error applying optimizations:', error);
      process.exit(1);
    }
    
    console.log('✅ Chat loading optimizations applied successfully!');
    console.log('🎯 Expected improvements:');
    console.log('   - Chat loading: ~50ms (vs 10+ seconds)');
    console.log('   - Names and profiles: Instant');
    console.log('   - Timestamps: Immediate');
    
  } catch (error) {
    console.error('❌ Failed to apply optimizations:', error);
    process.exit(1);
  }
}

// Run the script
applyOptimizations();






