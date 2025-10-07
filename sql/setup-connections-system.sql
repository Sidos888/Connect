-- Setup connections system for friends/connections management
-- This creates the necessary tables and functions for Instagram-style social connections

-- Create connections table to track friend relationships
CREATE TABLE IF NOT EXISTS connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, connected_user_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Create function to get mutual connections count
CREATE OR REPLACE FUNCTION get_mutual_connections_count(user1_id UUID, user2_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM connections c1
        JOIN connections c2 ON c1.connected_user_id = c2.connected_user_id
        WHERE c1.user_id = user1_id 
        AND c2.user_id = user2_id
        AND c1.status = 'accepted'
        AND c2.status = 'accepted'
        AND c1.connected_user_id != user1_id
        AND c1.connected_user_id != user2_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get mutual connections (up to limit)
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
    JOIN connections c2 ON c1.connected_user_id = c2.connected_user_id
    JOIN accounts a ON c1.connected_user_id = a.id
    WHERE c1.user_id = user1_id 
    AND c2.user_id = user2_id
    AND c1.status = 'accepted'
    AND c2.status = 'accepted'
    AND c1.connected_user_id != user1_id
    AND c1.connected_user_id != user2_id
    ORDER BY a.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if two users are connected
CREATE OR REPLACE FUNCTION are_users_connected(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM connections
        WHERE ((user_id = user1_id AND connected_user_id = user2_id) 
               OR (user_id = user2_id AND connected_user_id = user1_id))
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get connection status between two users
CREATE OR REPLACE FUNCTION get_connection_status(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
DECLARE
    connection_status TEXT;
BEGIN
    SELECT status INTO connection_status
    FROM connections
    WHERE user_id = user1_id AND connected_user_id = user2_id
    LIMIT 1;
    
    IF connection_status IS NULL THEN
        -- Check if the reverse connection exists
        SELECT status INTO connection_status
        FROM connections
        WHERE user_id = user2_id AND connected_user_id = user1_id
        LIMIT 1;
    END IF;
    
    RETURN COALESCE(connection_status, 'none');
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's connections (friends)
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
    JOIN accounts a ON c.connected_user_id = a.id
    WHERE c.user_id = user_id 
    AND c.status = status_filter
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's bidirectional connections (friends from both directions)
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
    JOIN connections c2 ON c1.connected_user_id = c2.user_id AND c1.user_id = c2.connected_user_id
    JOIN accounts a ON a.id = c1.connected_user_id
    WHERE c1.user_id = user_id 
    AND c1.status = status_filter
    AND c2.status = status_filter
    ORDER BY connected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for connections table
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connections
CREATE POLICY "Users can view their own connections" ON connections
    FOR SELECT USING (user_id = auth.uid() OR connected_user_id = auth.uid());

-- Policy: Users can insert their own connections
CREATE POLICY "Users can insert their own connections" ON connections
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own connections
CREATE POLICY "Users can update their own connections" ON connections
    FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own connections
CREATE POLICY "Users can delete their own connections" ON connections
    FOR DELETE USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON connections TO authenticated;
GRANT EXECUTE ON FUNCTION get_mutual_connections_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mutual_connections(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION are_users_connected(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_status(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_connections(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_bidirectional_connections(UUID, TEXT) TO authenticated;
