# How to Configure Supabase MCP

## Step-by-Step Instructions

### 1. Get Your Supabase Access Token

You already have a token visible: `sbp_9669...20`

**Next Steps:**
- Click the three dots (⋮) next to the token in the dashboard
- Select "Copy token" or "Reveal token"
- Save it somewhere temporarily (you'll need to paste it)

### 2. Update MCP Configuration

Edit `~/.cursor/mcp.json`:

```bash
code ~/.cursor/mcp.json
```

Replace the entire file content with:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/cli"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_9669_YOUR_FULL_TOKEN_HERE"
      }
    }
  }
}
```

**Replace `YOUR_FULL_TOKEN_HERE` with your actual full token**

### 3. Restart Cursor

- Close all Cursor windows
- Reopen Cursor
- The MCP connection should now work

### 4. Test the Connection

After restarting, try:
- Ask me to execute SQL via MCP
- The connection should work now

---

## Alternative: Run SQL Directly

If you don't want to set up MCP right now:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/rxlqtyfhsocxnsnnnlwl/sql/new

2. **Paste this SQL:**
   ```sql
   -- Optimize connections queries
   CREATE INDEX IF NOT EXISTS idx_connections_user1_user2_composite 
   ON connections(user1_id, user2_id);
   
   CREATE INDEX IF NOT EXISTS idx_connections_covering 
   ON connections(user1_id, user2_id, created_at DESC);
   
   DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
   
   CREATE POLICY "Users can view their own connections" 
   ON connections FOR SELECT 
   USING (user1_id = auth.uid() OR user2_id = auth.uid());
   ```

3. **Click "Run"**

4. **Refresh your app** - connections should load 2-5x faster
















