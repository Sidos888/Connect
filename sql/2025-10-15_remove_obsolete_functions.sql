-- ============================================================================
-- REMOVE OBSOLETE RPC FUNCTIONS
-- These functions are no longer needed after unified identity migration
-- ============================================================================

BEGIN;

-- Remove account creation/linking functions
DROP FUNCTION IF EXISTS app_get_or_create_account_for_auth_user();
DROP FUNCTION IF EXISTS app_create_or_link_account(text, text, text, text);
DROP FUNCTION IF EXISTS app_normalize_identifier(text, text);

-- Keep app_can_send_otp for rate limiting (still needed)

COMMIT;


