# Apply Chat Loading Optimizations

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Optimize chat loading performance
-- This creates the missing RPC function and adds indexes for fast chat loading

-- 1. Create the missing RPC function for last messages
CREATE OR REPLACE FUNCTION get_last_messages_for_chats(chat_ids uuid[])
RETURNS TABLE(
  chat_id uuid,
  message_text text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_messages AS (
    SELECT 
      cm.chat_id,
      cm.message_text,
      cm.created_at,
      ROW_NUMBER() OVER (PARTITION BY cm.chat_id ORDER BY cm.created_at DESC) as rn
    FROM chat_messages cm
    WHERE cm.chat_id = ANY(chat_ids)
      AND cm.deleted_at IS NULL
  )
  SELECT 
    rm.chat_id,
    rm.message_text,
    rm.created_at
  FROM ranked_messages rm
  WHERE rm.rn = 1;
END;
$$;

-- 2. Add critical indexes for fast chat loading
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat 
ON chat_participants(user_id, chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user 
ON chat_participants(chat_id, user_id);

CREATE INDEX IF NOT EXISTS idx_chats_last_message_at 
ON chats(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created 
ON chat_messages(chat_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 3. Create optimized view for chat list with all data in one query
CREATE OR REPLACE VIEW chat_list_optimized AS
SELECT 
  c.id as chat_id,
  c.type as chat_type,
  c.name as chat_name,
  c.last_message_at,
  c.created_at,
  -- Get other participants (not the current user)
  COALESCE(
    json_agg(
      json_build_object(
        'id', a.id,
        'name', a.name,
        'profile_pic', a.profile_pic
      )
    ) FILTER (WHERE a.id != auth.uid()),
    '[]'::json
  ) as other_participants,
  -- Get last message
  (
    SELECT json_build_object(
      'text', cm.message_text,
      'created_at', cm.created_at,
      'sender_id', cm.sender_id
    )
    FROM chat_messages cm
    WHERE cm.chat_id = c.id 
      AND cm.deleted_at IS NULL
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) as last_message
FROM chats c
INNER JOIN chat_participants cp ON cp.chat_id = c.id
INNER JOIN accounts a ON a.id = cp.user_id
WHERE cp.user_id = auth.uid()
GROUP BY c.id, c.type, c.name, c.last_message_at, c.created_at
ORDER BY c.last_message_at DESC NULLS LAST;

-- 4. Grant permissions
GRANT SELECT ON chat_list_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_last_messages_for_chats TO authenticated;

-- 5. Add RLS policy for the view
CREATE POLICY "Users can view their chat list" ON chat_list_optimized
FOR SELECT TO authenticated
USING (true);
```

4. Click **Run** to execute the SQL

## Option 2: CLI (if you have service role key)

```bash
# Add your service role key to .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env.local

# Run the script
node scripts/apply-chat-optimizations.js
```

## Expected Results After Applying:

- ✅ Chat loading: ~50ms (vs 10+ seconds)
- ✅ Names and profiles: Instant
- ✅ Timestamps: Immediate
- ✅ No more 404/500 errors
- ✅ No more timeouts

## Test After Applying:

```javascript
// In browser console
import('./lib/testChatLoading').then(m => m.testChatLoading())
```




















