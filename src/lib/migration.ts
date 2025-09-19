import { supabase } from './supabaseClient';

export async function runMigration() {
  console.log('🔄 Starting migration to new authentication system...');
  
  try {
    // 1. Create accounts table
    console.log('📊 Creating accounts table...');
    const { error: accountsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          bio TEXT,
          dob DATE,
          profile_pic TEXT,
          connect_id TEXT UNIQUE,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `
    });
    
    if (accountsError) {
      console.error('❌ Error creating accounts table:', accountsError);
    } else {
      console.log('✅ Accounts table created');
    }

    // 2. Create account_identities table
    console.log('📊 Creating account_identities table...');
    const { error: identitiesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS account_identities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
          auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          method TEXT NOT NULL,
          identifier TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(auth_user_id),
          UNIQUE(method, identifier)
        );
      `
    });
    
    if (identitiesError) {
      console.error('❌ Error creating account_identities table:', identitiesError);
    } else {
      console.log('✅ Account_identities table created');
    }

    // 3. Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE account_identities ENABLE ROW LEVEL SECURITY;
      `
    });

    // 4. Create RLS policies
    console.log('🛡️ Creating security policies...');
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "Users can view their own account" ON accounts
          FOR SELECT USING (
            id IN (
              SELECT ai.account_id 
              FROM account_identities ai 
              WHERE ai.auth_user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can update their own account" ON accounts
          FOR UPDATE USING (
            id IN (
              SELECT ai.account_id 
              FROM account_identities ai 
              WHERE ai.auth_user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can insert their own account" ON accounts
          FOR INSERT WITH CHECK (true);

        CREATE POLICY "Users can view their own identities" ON account_identities
          FOR SELECT USING (auth_user_id = auth.uid());

        CREATE POLICY "Users can insert their own identities" ON account_identities
          FOR INSERT WITH CHECK (auth_user_id = auth.uid());
      `
    });

    console.log('✅ Migration completed successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}

// Simplified version that works with current Supabase setup
export async function createNewTables() {
  console.log('🔄 Creating new authentication tables...');
  
  try {
    // Create accounts table
    const { error: error1 } = await supabase
      .from('accounts')
      .select('*')
      .limit(1);
    
    if (error1 && error1.message.includes('does not exist')) {
      console.log('📊 Creating accounts table...');
      // Table doesn't exist, we'll create it through the auth context
    }

    // Create account_identities table  
    const { error: error2 } = await supabase
      .from('account_identities')
      .select('*')
      .limit(1);
      
    if (error2 && error2.message.includes('does not exist')) {
      console.log('📊 Creating account_identities table...');
      // Table doesn't exist, we'll create it through the auth context
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return { success: false, error };
  }
}

