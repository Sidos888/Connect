-- Optimize connections queries for faster loading
-- This addresses the slow connections loading issue

-- 1. Add composite index for faster OR queries (user1_id OR user2_id)
CREATE INDEX IF NOT EXISTS idx_connections_user1_user2_composite 
ON connections(user1_id, user2_id);

-- 2. Add covering index to include created_at for sorting
CREATE INDEX IF NOT EXISTS idx_connections_covering 
ON connections(user1_id, user2_id, created_at DESC);

-- 3. Optimize RLS policy to avoid nested subqueries
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;

CREATE POLICY "Users can view their own connections" 
ON connections 
FOR SELECT 
USING (
  -- Simple check, no subquery needed
  user1_id = auth.uid() OR user2_id = auth.uid()
);

-- 4. Add comment explaining the optimization
COMMENT ON INDEX idx_connections_user1_user2_composite IS 'Speeds up connections queries with OR conditions';
COMMENT ON INDEX idx_connections_covering IS 'Covering index for connections list with sorting';















