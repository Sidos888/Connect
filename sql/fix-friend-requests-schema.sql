-- Fix friend_requests table schema to match connectionsService expectations
-- The connectionsService expects both friend_requests and connections tables with specific schemas

-- First, drop existing connections table if it has wrong schema
DROP TABLE IF EXISTS connections CASCADE;

-- Create friend_requests table (if not exists)
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Create connections table for accepted friendships (bidirectional)
CREATE TABLE IF NOT EXISTS connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id != user2_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

CREATE INDEX IF NOT EXISTS idx_connections_user1_id ON connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2_id ON connections(user2_id);

-- Enable RLS on both tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Friend requests RLS policies
DROP POLICY IF EXISTS "Users can view their friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete their sent friend requests" ON friend_requests;

CREATE POLICY "Users can view their friend requests" ON friend_requests
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received friend requests" ON friend_requests
    FOR UPDATE USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete their sent friend requests" ON friend_requests
    FOR DELETE USING (sender_id = auth.uid());

-- Connections RLS policies
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
DROP POLICY IF EXISTS "Users can insert their connections" ON connections;
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON connections;

CREATE POLICY "Users can view their connections" ON connections
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can insert their connections" ON connections
    FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update their connections" ON connections
    FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can delete their connections" ON connections
    FOR DELETE USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON friend_requests TO authenticated;
GRANT ALL ON connections TO authenticated;
