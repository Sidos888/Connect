#!/usr/bin/env node

/**
 * Supabase Auth Rate Limits Configuration Script
 * 
 * This script configures auth rate limits for development and production environments
 * using the Supabase Management API.
 * 
 * Usage:
 *   node scripts/configure-auth-rate-limits.js [environment] [action]
 * 
 * Examples:
 *   node scripts/configure-auth-rate-limits.js prod set-dev-limits
 *   node scripts/configure-auth-rate-limits.js prod set-prod-limits
 *   node scripts/configure-auth-rate-limits.js prod get-current
 */

const https = require('https');

// Configuration
const CONFIG = {
  prod: {
    projectRef: 'rxlqtyfhsocxnsnnnlwl', 
    name: 'Connect-Prod'
  }
};

// Rate limit configurations
const RATE_LIMITS = {
  // Development-friendly limits
  dev: {
    rate_limit_anonymous_users: 100,    // 100 per hour (was 30)
    rate_limit_email_sent: 50,          // 50 per hour (was 4)
    rate_limit_sms_sent: 100,           // 100 per hour (was 30)
    rate_limit_verify: 100,             // 100 per hour (was 360)
    rate_limit_token_refresh: 1000,     // 1000 per hour (was 1800)
    rate_limit_otp: 100,                // 100 per hour (was 360)
    rate_limit_web3: 100                // 100 per hour
  },
  
  // Production limits (more conservative)
  prod: {
    rate_limit_anonymous_users: 30,     // Standard
    rate_limit_email_sent: 30,          // 30 per hour (custom SMTP)
    rate_limit_sms_sent: 30,            // Standard
    rate_limit_verify: 360,             // Standard
    rate_limit_token_refresh: 1800,     // Standard
    rate_limit_otp: 360,                // Standard
    rate_limit_web3: 100                // Standard
  }
};

async function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function getCurrentRateLimits(projectRef, accessToken) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await makeRequest(url, options);
  
  if (response.status !== 200) {
    throw new Error(`Failed to get rate limits: ${response.status} ${JSON.stringify(response.data)}`);
  }

  // Filter rate limit settings
  const rateLimits = {};
  Object.keys(response.data).forEach(key => {
    if (key.startsWith('rate_limit_')) {
      rateLimits[key] = response.data[key];
    }
  });

  return rateLimits;
}

async function updateRateLimits(projectRef, accessToken, rateLimits) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const options = {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await makeRequest(url, options, rateLimits);
  
  if (response.status !== 200) {
    throw new Error(`Failed to update rate limits: ${response.status} ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

function printRateLimits(rateLimits, title) {
  console.log(`\n📊 ${title}`);
  console.log('=' .repeat(50));
  
  const sortedKeys = Object.keys(rateLimits).sort();
  sortedKeys.forEach(key => {
    const value = rateLimits[key];
    console.log(`${key.padEnd(30)}: ${value}`);
  });
  console.log('');
}

async function main() {
  const environment = process.argv[2];
  const action = process.argv[3];

  if (!environment || !CONFIG[environment]) {
    console.error('❌ Usage: node configure-auth-rate-limits.js [staging|prod] [action]');
    console.error('Actions: get-current, set-dev-limits, set-prod-limits');
    process.exit(1);
  }

  if (!action) {
    console.error('❌ Please specify an action: get-current, set-dev-limits, set-prod-limits');
    process.exit(1);
  }

  // Get access token from environment
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('❌ Please set SUPABASE_ACCESS_TOKEN environment variable');
    console.error('Get your token from: https://supabase.com/dashboard/account/tokens');
    process.exit(1);
  }

  const project = CONFIG[environment];
  
  try {
    console.log(`🔧 Configuring ${project.name} (${project.projectRef})`);
    
    switch (action) {
      case 'get-current':
        console.log('📋 Getting current rate limits...');
        const current = await getCurrentRateLimits(project.projectRef, accessToken);
        printRateLimits(current, `Current Rate Limits - ${project.name}`);
        break;
        
      case 'set-dev-limits':
        console.log('🚀 Setting development-friendly rate limits...');
        await updateRateLimits(project.projectRef, accessToken, RATE_LIMITS.dev);
        console.log('✅ Development rate limits applied!');
        
        // Show what was set
        const newDevLimits = await getCurrentRateLimits(project.projectRef, accessToken);
        printRateLimits(newDevLimits, `Updated Rate Limits - ${project.name}`);
        break;
        
      case 'set-prod-limits':
        console.log('🛡️ Setting production rate limits...');
        await updateRateLimits(project.projectRef, accessToken, RATE_LIMITS.prod);
        console.log('✅ Production rate limits applied!');
        
        // Show what was set
        const newProdLimits = await getCurrentRateLimits(project.projectRef, accessToken);
        printRateLimits(newProdLimits, `Updated Rate Limits - ${project.name}`);
        break;
        
      default:
        console.error(`❌ Unknown action: ${action}`);
        console.error('Available actions: get-current, set-dev-limits, set-prod-limits');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getCurrentRateLimits, updateRateLimits, RATE_LIMITS };
