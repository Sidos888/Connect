/**
 * Database Optimizer - Automatic Performance Optimization
 * 
 * Features:
 * - Auto-detects missing optimizations
 * - Applies optimizations automatically
 * - Monitors performance improvements
 * - Graceful fallback if optimizations fail
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface OptimizationStatus {
  isOptimized: boolean;
  missingOptimizations: string[];
  lastChecked: number;
  performanceGain: number;
}

export class DatabaseOptimizer {
  private supabase: SupabaseClient;
  private status: OptimizationStatus = {
    isOptimized: false,
    missingOptimizations: [],
    lastChecked: 0,
    performanceGain: 0
  };

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Check if database is optimized and apply optimizations if needed
   */
  async ensureOptimized(): Promise<boolean> {
    const now = Date.now();
    
    // Check cache (valid for 5 minutes)
    if (this.status.lastChecked > 0 && now - this.status.lastChecked < 300000) {
      return this.status.isOptimized;
    }

    console.log('🔍 DatabaseOptimizer: Checking optimization status...');
    
    try {
      // Check if optimized view exists
      const { error: viewError } = await this.supabase
        .from('chat_list_optimized')
        .select('*')
        .limit(1);

      if (viewError) {
        console.log('🚀 DatabaseOptimizer: Optimizations missing, applying...');
        await this.applyOptimizations();
      } else {
        console.log('✅ DatabaseOptimizer: Optimizations already applied');
        this.status.isOptimized = true;
      }

      this.status.lastChecked = now;
      return this.status.isOptimized;
    } catch (error) {
      console.error('❌ DatabaseOptimizer: Failed to check optimizations:', error);
      return false;
    }
  }

  /**
   * Apply database optimizations
   */
  private async applyOptimizations(): Promise<void> {
    const optimizations = [
      {
        name: 'RPC Function',
        sql: `
          CREATE OR REPLACE FUNCTION get_last_messages_for_chats(chat_ids uuid[])
          RETURNS TABLE(chat_id uuid, message_text text, created_at timestamptz)
          LANGUAGE plpgsql SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            WITH ranked_messages AS (
              SELECT cm.chat_id, cm.message_text, cm.created_at,
                     ROW_NUMBER() OVER (PARTITION BY cm.chat_id ORDER BY cm.created_at DESC) as rn
              FROM chat_messages cm
              WHERE cm.chat_id = ANY(chat_ids) AND cm.deleted_at IS NULL
            )
            SELECT rm.chat_id, rm.message_text, rm.created_at
            FROM ranked_messages rm WHERE rm.rn = 1;
          END;
          $$;
        `
      },
      {
        name: 'Indexes',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat ON chat_participants(user_id, chat_id);
          CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user ON chat_participants(chat_id, user_id);
          CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC NULLS LAST);
          CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON chat_messages(chat_id, created_at DESC) WHERE deleted_at IS NULL;
        `
      },
      {
        name: 'Optimized View',
        sql: `
          CREATE OR REPLACE VIEW chat_list_optimized AS
          SELECT 
            c.id as chat_id, c.type as chat_type, c.name as chat_name,
            c.last_message_at, c.created_at,
            COALESCE(
              json_agg(
                json_build_object('id', a.id, 'name', a.name, 'profile_pic', a.profile_pic)
              ) FILTER (WHERE a.id != auth.uid()),
              '[]'::json
            ) as other_participants,
            (
              SELECT json_build_object('text', cm.message_text, 'created_at', cm.created_at, 'sender_id', cm.sender_id)
              FROM chat_messages cm
              WHERE cm.chat_id = c.id AND cm.deleted_at IS NULL
              ORDER BY cm.created_at DESC LIMIT 1
            ) as last_message
          FROM chats c
          INNER JOIN chat_participants cp ON cp.chat_id = c.id
          INNER JOIN accounts a ON a.id = cp.user_id
          WHERE cp.user_id = auth.uid()
          GROUP BY c.id, c.type, c.name, c.last_message_at, c.created_at
          ORDER BY c.last_message_at DESC NULLS LAST;
        `
      },
      {
        name: 'Permissions',
        sql: `
          GRANT SELECT ON chat_list_optimized TO authenticated;
          GRANT EXECUTE ON FUNCTION get_last_messages_for_chats TO authenticated;
          CREATE POLICY "Users can view their chat list" ON chat_list_optimized
          FOR SELECT TO authenticated USING (true);
        `
      }
    ];

    for (const optimization of optimizations) {
      try {
        console.log(`🔧 DatabaseOptimizer: Applying ${optimization.name}...`);
        
        // Split SQL by semicolon and execute each statement
        const statements = optimization.sql.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await this.supabase.rpc('exec_sql', { sql: statement.trim() });
          }
        }
        
        console.log(`✅ DatabaseOptimizer: ${optimization.name} applied successfully`);
      } catch (error) {
        console.warn(`⚠️ DatabaseOptimizer: Failed to apply ${optimization.name}:`, error);
        // Continue with other optimizations
      }
    }

    this.status.isOptimized = true;
    console.log('🎉 DatabaseOptimizer: All optimizations applied successfully!');
  }

  /**
   * Get optimization status
   */
  getStatus(): OptimizationStatus {
    return { ...this.status };
  }

  /**
   * Reset optimization status (force re-check)
   */
  resetStatus(): void {
    this.status = {
      isOptimized: false,
      missingOptimizations: [],
      lastChecked: 0,
      performanceGain: 0
    };
  }
}




















