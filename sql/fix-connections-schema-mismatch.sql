-- Fix connections table schema mismatch
-- The application code expects user1_id and user2_id columns, but the schema has user_id and connected_user_id

-- 1. First, check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'connections' 
ORDER BY ordinal_position;

-- 2. If the table has user_id and connected_user_id, we need to rename them
-- (This will preserve existing data)

-- Rename columns to match application expectations
ALTER TABLE connections RENAME COLUMN user_id TO user1_id;
ALTER TABLE connections RENAME COLUMN connected_user_id TO user2_id;

-- 3. Update the unique constraint to match new column names
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_user_id_connected_user_id_key;
ALTER TABLE connections ADD CONSTRAINT connections_user1_id_user2_id_key UNIQUE(user1_id, user2_id);

-- 4. Update indexes to match new column names
DROP INDEX IF EXISTS idx_connections_user_id;
DROP INDEX IF EXISTS idx_connections_connected_user_id;

CREATE INDEX IF NOT EXISTS idx_connections_user1_id ON connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2_id ON connections(user2_id);

-- 5. Update RLS policies to use new column names
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON connections;

-- Recreate policies with correct column names
CREATE POLICY "Users can view their own connections" ON connections
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can insert their own connections" ON connections
    FOR INSERT WITH CHECK (user1_id = auth.uid());

CREATE POLICY "Users can update their own connections" ON connections
    FOR UPDATE USING (user1_id = auth.uid());

CREATE POLICY "Users can delete their own connections" ON connections
    FOR DELETE USING (user1_id = auth.uid());

-- 6. Update stored functions to use new column names
CREATE OR REPLACE FUNCTION get_mutual_connections_count(user1_id UUID, user2_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM connections c1
        JOIN connections c2 ON c1.user2_id = c2.user2_id
        WHERE c1.user1_id = $1 
        AND c2.user1_id = $2
        AND c1.status = 'accepted'
        AND c2.status = 'accepted'
        AND c1.user2_id != $1
        AND c1.user2_id != $2
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_mutual_connections(user1_id UUID, user2_id UUID, limit_count INTEGER DEFAULT 3)
RETURNS TABLE(
    id UUID,
    name TEXT,
    profile_pic TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.profile_pic
    FROM connections c1
    JOIN connections c2 ON c1.user2_id = c2.user2_id
    JOIN accounts a ON c1.user2_id = a.id
    WHERE c1.user1_id = $1 
    AND c2.user1_id = $2
    AND c1.status = 'accepted'
    AND c2.status = 'accepted'
    AND c1.user2_id != $1
    AND c1.user2_id != $2
    ORDER BY a.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION are_users_connected(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM connections
        WHERE ((user1_id = $1 AND user2_id = $2) 
               OR (user1_id = $2 AND user2_id = $1))
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_connection_status(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
DECLARE
    connection_status TEXT;
BEGIN
    SELECT status INTO connection_status
    FROM connections
    WHERE user1_id = $1 AND user2_id = $2
    LIMIT 1;
    
    IF connection_status IS NULL THEN
        -- Check if the reverse connection exists
        SELECT status INTO connection_status
        FROM connections
        WHERE user1_id = $2 AND user2_id = $1
        LIMIT 1;
    END IF;
    
    RETURN COALESCE(connection_status, 'none');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_connections(user_id UUID, status_filter TEXT DEFAULT 'accepted')
RETURNS TABLE(
    id UUID,
    name TEXT,
    profile_pic TEXT,
    bio TEXT,
    connected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.profile_pic,
        a.bio,
        c.created_at as connected_at
    FROM connections c
    JOIN accounts a ON c.user2_id = a.id
    WHERE c.user1_id = $1 
    AND c.status = status_filter
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_bidirectional_connections(user_id UUID, status_filter TEXT DEFAULT 'accepted')
RETURNS TABLE(
    id UUID,
    name TEXT,
    profile_pic TEXT,
    bio TEXT,
    connected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        a.id,
        a.name,
        a.profile_pic,
        a.bio,
        GREATEST(c1.created_at, c2.created_at) as connected_at
    FROM connections c1
    JOIN connections c2 ON c1.user2_id = c2.user1_id AND c1.user1_id = c2.user2_id
    JOIN accounts a ON a.id = c1.user2_id
    WHERE c1.user1_id = $1 
    AND c1.status = status_filter
    AND c2.status = status_filter
    ORDER BY connected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'connections' 
ORDER BY ordinal_position;
