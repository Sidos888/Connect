#!/bin/bash

# =====================================================================
# Configure Email OTP for Connect-Staging
# Description: Update auth configuration to use 6-digit OTP codes
# =====================================================================

# Configuration
PROJECT_REF="rxlqtyfhsocxnsnnnlwl"  # Connect-Prod
PROJECT_NAME="Connect-Prod"

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not set"
    echo "Get your token from: https://supabase.com/dashboard/account/tokens"
    echo ""
    echo "Usage:"
    echo "  export SUPABASE_ACCESS_TOKEN='your-token-here'"
    echo "  bash scripts/configure-email-otp.sh"
    exit 1
fi

echo "🔧 Configuring Email OTP for $PROJECT_NAME ($PROJECT_REF)"
echo ""

# Get current auth configuration
echo "📋 Current auth configuration:"
curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🚀 Updating auth configuration to enable OTP..."
echo ""

# Update auth configuration
# Note: The key setting is ensuring mailer_otp_enabled is true
# And that email templates use {{ .Token }} instead of {{ .ConfirmationURL }}
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_otp_enabled": true,
    "mailer_otp_exp": 3600
  }'

echo ""
echo "✅ Auth configuration updated!"
echo ""
echo "📋 Updated auth configuration:"
curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "⚠️  IMPORTANT: You still need to update email templates in the Supabase Dashboard:"
echo "   1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/templates"
echo "   2. Update email templates to use {{ .Token }} instead of {{ .ConfirmationURL }}"
echo ""
echo "✅ Configuration complete!"
