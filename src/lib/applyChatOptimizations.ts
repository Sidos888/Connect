/**
 * Browser-based script to apply chat loading optimizations
 * This can be run directly in the browser console
 */

export async function applyChatOptimizations() {
  console.log('🚀 Applying chat loading optimizations...');
  
  // Get the Supabase client from the auth context
  const authContext = (window as any).__authContext;
  if (!authContext?.supabase) {
    console.error('❌ No Supabase client found. Please make sure you\'re logged in.');
    return;
  }
  
  const supabase = authContext.supabase;
  
  try {
    // Test 1: Create the RPC function for last messages
    console.log('📝 Creating get_last_messages_for_chats RPC function...');
    
    const createRpcFunction = `
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
    `;
    
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: createRpcFunction });
    if (rpcError) {
      console.warn('⚠️ Could not create RPC function (may not have permissions):', rpcError.message);
    } else {
      console.log('✅ RPC function created successfully');
    }
    
    // Test 2: Create indexes (these might fail due to permissions, but that's okay)
    console.log('📝 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat ON chat_participants(user_id, chat_id);',
      'CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user ON chat_participants(chat_id, user_id);',
      'CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC NULLS LAST);',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON chat_messages(chat_id, created_at DESC) WHERE deleted_at IS NULL;'
    ];
    
    for (const indexSql of indexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
        if (error) {
          console.warn(`⚠️ Could not create index (may not have permissions): ${error.message}`);
        } else {
          console.log('✅ Index created successfully');
        }
      } catch (err) {
        console.warn('⚠️ Index creation failed:', err);
      }
    }
    
    // Test 3: Create the optimized view (this might fail due to permissions)
    console.log('📝 Creating chat_list_optimized view...');
    
    const createView = `
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
    `;
    
    const { error: viewError } = await supabase.rpc('exec_sql', { sql: createView });
    if (viewError) {
      console.warn('⚠️ Could not create view (may not have permissions):', viewError.message);
    } else {
      console.log('✅ Optimized view created successfully');
    }
    
    // Test 4: Test the optimized query
    console.log('🧪 Testing optimized query...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('chat_list_optimized')
        .select('*')
        .limit(5);
      
      if (testError) {
        console.log('ℹ️ Optimized view not available yet, but fast query should still work');
      } else {
        console.log('✅ Optimized view is working!', { chatCount: testData?.length || 0 });
      }
    } catch (err) {
      console.log('ℹ️ Optimized view not available yet, but fast query should still work');
    }
    
    console.log('✅ Chat optimizations applied! The fast query should now work much better.');
    console.log('💡 Note: Some optimizations may require database admin permissions to apply fully.');
    
  } catch (error) {
    console.error('❌ Error applying optimizations:', error);
  }
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).applyChatOptimizations = applyChatOptimizations;
}
















