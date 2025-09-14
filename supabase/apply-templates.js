#!/usr/bin/env node

/**
 * Script to apply custom email templates to Supabase
 * This script reads the HTML templates and provides instructions for manual application
 */

const fs = require('fs');
const path = require('path');

const templates = [
  { name: 'Confirmation', file: 'confirmation.html', type: 'confirm_signup' },
  { name: 'Recovery', file: 'recovery.html', type: 'reset_password' },
  { name: 'Magic Link', file: 'magic_link.html', type: 'magic_link' },
  { name: 'Invite', file: 'invite.html', type: 'invite_user' },
  { name: 'Email Change', file: 'email_change.html', type: 'change_email' },
  { name: 'Phone Change', file: 'phone_change.html', type: 'change_phone' }
];

console.log('🎨 Connect Email Templates\n');
console.log('This script will help you apply custom email templates to your Supabase project.\n');

// Check if templates directory exists
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  console.error('❌ Templates directory not found. Please run this script from the supabase directory.');
  process.exit(1);
}

console.log('📋 Available Templates:\n');

templates.forEach((template, index) => {
  const filePath = path.join(templatesDir, template.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const size = Math.round(content.length / 1024 * 100) / 100;
    console.log(`${index + 1}. ${template.name} (${template.type})`);
    console.log(`   File: ${template.file} (${size}KB)`);
    console.log(`   Status: ✅ Ready\n`);
  } else {
    console.log(`${index + 1}. ${template.name} (${template.type})`);
    console.log(`   File: ${template.file}`);
    console.log(`   Status: ❌ Missing\n`);
  }
});

console.log('🚀 How to Apply These Templates:\n');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to Authentication → Email Templates');
console.log('3. For each template:');
console.log('   - Click on the template name');
console.log('   - Replace the default HTML with the content from the corresponding file');
console.log('   - Save the changes\n');

console.log('📁 Template Files Location:');
console.log(`   ${templatesDir}\n`);

console.log('💡 Pro Tips:');
console.log('- Test each template in a development environment first');
console.log('- Make sure your site URL is correctly configured in Supabase');
console.log('- Check that all template variables ({{ .Token }}, {{ .ConfirmationURL }}, etc.) are working');
console.log('- Consider setting up email delivery service for production\n');

console.log('🔧 Template Variables Used:');
console.log('- {{ .Token }} - Verification code');
console.log('- {{ .ConfirmationURL }} - Confirmation link');
console.log('- {{ .Email }} - User email address');
console.log('- {{ .SiteURL }} - Your site URL\n');

console.log('✨ Your email templates are ready to make a great first impression!');
