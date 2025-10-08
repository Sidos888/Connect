-- Create friend_requests table for friend request system
-- This table handles friend requests between users

CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view friend requests they sent or received
CREATE POLICY "Users can view their friend requests" ON friend_requests
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policy: Users can insert friend requests they send
CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Policy: Users can update friend requests they received (to accept/reject)
CREATE POLICY "Users can update received friend requests" ON friend_requests
    FOR UPDATE USING (receiver_id = auth.uid());

-- Policy: Users can delete friend requests they sent
CREATE POLICY "Users can delete their sent friend requests" ON friend_requests
    FOR DELETE USING (sender_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON friend_requests TO authenticated;
