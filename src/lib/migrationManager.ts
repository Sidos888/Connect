/**
 * Migration Manager - Automatic Database Schema Updates
 * 
 * Features:
 * - Version-based migrations
 * - Automatic rollback on failure
 * - Migration history tracking
 * - Safe schema updates
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
  appliedAt?: Date;
}

export class MigrationManager {
  private supabase: SupabaseClient;
  private migrations: Migration[] = [];

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.initializeMigrations();
  }

  /**
   * Initialize migration definitions
   */
  private initializeMigrations(): void {
    this.migrations = [
      {
        version: 1,
        name: 'chat_loading_optimizations',
        up: `
          -- Create RPC function for last messages
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

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat ON chat_participants(user_id, chat_id);
          CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user ON chat_participants(chat_id, user_id);
          CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC NULLS LAST);
          CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON chat_messages(chat_id, created_at DESC) WHERE deleted_at IS NULL;

          -- Create optimized view
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

          -- Grant permissions
          GRANT SELECT ON chat_list_optimized TO authenticated;
          GRANT EXECUTE ON FUNCTION get_last_messages_for_chats TO authenticated;
          CREATE POLICY "Users can view their chat list" ON chat_list_optimized
          FOR SELECT TO authenticated USING (true);
        `,
        down: `
          DROP VIEW IF EXISTS chat_list_optimized CASCADE;
          DROP FUNCTION IF EXISTS get_last_messages_for_chats(uuid[]);
          DROP INDEX IF EXISTS idx_chat_participants_user_chat;
          DROP INDEX IF EXISTS idx_chat_participants_chat_user;
          DROP INDEX IF EXISTS idx_chats_last_message_at;
          DROP INDEX IF EXISTS idx_chat_messages_chat_created;
        `
      }
    ];
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<{ applied: number; errors: string[] }> {
    console.log('🔄 MigrationManager: Starting migration process...');
    
    const errors: string[] = [];
    let applied = 0;

    try {
      // Get current version
      const currentVersion = await this.getCurrentVersion();
      console.log(`📊 MigrationManager: Current version: ${currentVersion}`);

      // Find pending migrations
      const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);
      console.log(`📋 MigrationManager: Found ${pendingMigrations.length} pending migrations`);

      // Apply each migration
      for (const migration of pendingMigrations) {
        try {
          console.log(`🚀 MigrationManager: Applying migration ${migration.version}: ${migration.name}`);
          
          await this.applyMigration(migration);
          await this.recordMigration(migration);
          
          applied++;
          console.log(`✅ MigrationManager: Migration ${migration.version} applied successfully`);
        } catch (error) {
          const errorMsg = `Failed to apply migration ${migration.version}: ${error}`;
          console.error(`❌ MigrationManager: ${errorMsg}`);
          errors.push(errorMsg);
          
          // Try to rollback
          try {
            await this.rollbackMigration(migration);
            console.log(`🔄 MigrationManager: Rolled back migration ${migration.version}`);
          } catch (rollbackError) {
            console.error(`❌ MigrationManager: Failed to rollback migration ${migration.version}:`, rollbackError);
          }
        }
      }

      console.log(`🎉 MigrationManager: Migration process completed. Applied: ${applied}, Errors: ${errors.length}`);
      return { applied, errors };
    } catch (error) {
      console.error('❌ MigrationManager: Migration process failed:', error);
      errors.push(`Migration process failed: ${error}`);
      return { applied, errors };
    }
  }

  /**
   * Get current database version
   */
  private async getCurrentVersion(): Promise<number> {
    try {
      // Check if migrations table exists
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('version')
        .order('version', { ascending: false })
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, create it
        await this.createMigrationsTable();
        return 0;
      }

      return data?.[0]?.version || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Create migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await this.supabase.rpc('exec_sql', { sql: createTableSQL });
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(migration: Migration): Promise<void> {
    const statements = migration.up.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await this.supabase.rpc('exec_sql', { sql: statement.trim() });
      }
    }
  }

  /**
   * Record migration in database
   */
  private async recordMigration(migration: Migration): Promise<void> {
    await this.supabase
      .from('schema_migrations')
      .insert({
        version: migration.version,
        name: migration.name,
        applied_at: new Date().toISOString()
      });
  }

  /**
   * Rollback a migration
   */
  private async rollbackMigration(migration: Migration): Promise<void> {
    const statements = migration.down.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await this.supabase.rpc('exec_sql', { sql: statement.trim() });
      }
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{ currentVersion: number; pendingMigrations: number; totalMigrations: number }> {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion).length;
    
    return {
      currentVersion,
      pendingMigrations,
      totalMigrations: this.migrations.length
    };
  }
}

























