-- Update existing profile names to have proper capitalization
-- This script capitalizes the first letter of each word in names

-- Function to capitalize names properly
CREATE OR REPLACE FUNCTION capitalize_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_name IS NULL OR input_name = '' THEN
    RETURN input_name;
  END IF;
  
  -- Split by spaces and capitalize each word
  RETURN regexp_replace(
    regexp_replace(
      lower(input_name), 
      '\m\w', 
      upper('\&'), 
      'g'
    ),
    '\s+', 
    ' ', 
    'g'
  );
END;
$$ LANGUAGE plpgsql;

-- Update all names in the accounts table
UPDATE accounts 
SET name = capitalize_name(name),
    updated_at = NOW()
WHERE name IS NOT NULL 
  AND name != '' 
  AND name != capitalize_name(name);

-- Update all names in the personal_profiles table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_profiles') THEN
    UPDATE personal_profiles 
    SET name = capitalize_name(name),
        updated_at = NOW()
    WHERE name IS NOT NULL 
      AND name != '' 
      AND name != capitalize_name(name);
  END IF;
END $$;

-- Update all names in the businesses table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') THEN
    UPDATE businesses 
    SET name = capitalize_name(name),
        updated_at = NOW()
    WHERE name IS NOT NULL 
      AND name != '' 
      AND name != capitalize_name(name);
  END IF;
END $$;

-- Clean up the function
DROP FUNCTION IF EXISTS capitalize_name(TEXT);
