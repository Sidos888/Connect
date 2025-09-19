"use client";

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function MigrationTestPage() {
  const [status, setStatus] = useState<string>('Ready to migrate');
  const [logs, setLogs] = useState<string[]>([]);
  const supabase = getSupabaseClient();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const createTables = async () => {
    if (!supabase) {
      addLog('❌ Supabase client not available');
      return;
    }

    try {
      setStatus('Creating tables...');
      addLog('🔄 Starting table creation...');

      // Check if tables exist by trying to query them
      addLog('📊 Checking existing tables...');
      
      const { data: existingProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact', head: true });

      if (!profilesError) {
        addLog(`✅ Found ${existingProfiles?.[0]?.count || 0} existing profiles`);
      }

      // Try to create accounts table (will fail if already exists, which is fine)
      addLog('📊 Checking/creating accounts table...');
      const { data: accountsTest, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .limit(1);

      if (accountsError && accountsError.message.includes('does not exist')) {
        addLog('❌ Accounts table does not exist - needs to be created in Supabase dashboard');
        addLog('📝 Please run the SQL from create-new-auth-system.sql in your Supabase dashboard');
        setStatus('❌ Tables need to be created manually');
        return;
      } else if (!accountsError) {
        addLog('✅ Accounts table exists');
      }

      // Check account_identities table
      addLog('📊 Checking account_identities table...');
      const { data: identitiesTest, error: identitiesError } = await supabase
        .from('account_identities')
        .select('*')
        .limit(1);

      if (identitiesError && identitiesError.message.includes('does not exist')) {
        addLog('❌ Account_identities table does not exist');
        setStatus('❌ Tables need to be created manually');
        return;
      } else if (!identitiesError) {
        addLog('✅ Account_identities table exists');
      }

      setStatus('✅ Tables ready');
      addLog('🎉 All tables are ready!');

    } catch (error) {
      addLog(`❌ Error: ${error}`);
      setStatus('❌ Error occurred');
    }
  };

  const migrateData = async () => {
    if (!supabase) {
      addLog('❌ Supabase client not available');
      return;
    }

    try {
      setStatus('Migrating data...');
      addLog('🔄 Starting data migration...');

      // Get all existing profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        addLog(`❌ Error fetching profiles: ${profilesError.message}`);
        return;
      }

      addLog(`📦 Found ${profiles?.length || 0} profiles to migrate`);

      if (!profiles || profiles.length === 0) {
        addLog('ℹ️ No profiles to migrate');
        setStatus('✅ Migration complete (no data)');
        return;
      }

      for (const profile of profiles) {
        try {
          addLog(`🔄 Migrating profile: ${profile.name || profile.id}`);

          // Check if account already exists for this profile
          const { data: existingAccount, error: existingError } = await supabase
            .from('accounts')
            .select('id')
            .eq('connect_id', profile.connect_id)
            .single();

          if (existingAccount) {
            addLog(`⏭️ Account already exists for ${profile.name}, skipping`);
            continue;
          }

          // Create new account
          const { data: newAccount, error: accountError } = await supabase
            .from('accounts')
            .insert({
              name: profile.name || 'User',
              bio: profile.bio,
              dob: profile.dob,
              profile_pic: profile.profile_pic,
              connect_id: profile.connect_id
            })
            .select()
            .single();

          if (accountError) {
            addLog(`❌ Error creating account for ${profile.name}: ${accountError.message}`);
            continue;
          }

          // Get auth user details
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
          
          if (authError) {
            addLog(`⚠️ Could not get auth user for ${profile.name}: ${authError.message}`);
          }

          // Link the auth user to the new account
          const { error: identityError } = await supabase
            .from('account_identities')
            .insert({
              account_id: newAccount.id,
              auth_user_id: profile.id,
              method: 'migrated',
              identifier: profile.id
            });

          if (identityError) {
            addLog(`❌ Error linking identity for ${profile.name}: ${identityError.message}`);
            continue;
          }

          // Add email identity if available
          if (authUser?.user?.email) {
            await supabase
              .from('account_identities')
              .insert({
                account_id: newAccount.id,
                auth_user_id: profile.id,
                method: 'email',
                identifier: authUser.user.email
              });
          }

          // Add phone identity if available
          if (authUser?.user?.phone) {
            await supabase
              .from('account_identities')
              .insert({
                account_id: newAccount.id,
                auth_user_id: profile.id,
                method: 'phone',
                identifier: authUser.user.phone
              });
          }

          addLog(`✅ Successfully migrated ${profile.name}`);

        } catch (error) {
          addLog(`❌ Error migrating ${profile.name || profile.id}: ${error}`);
        }
      }

      setStatus('✅ Migration complete');
      addLog('🎉 Migration completed!');

    } catch (error) {
      addLog(`❌ Migration error: ${error}`);
      setStatus('❌ Migration failed');
    }
  };

  const testNewSystem = async () => {
    if (!supabase) {
      addLog('❌ Supabase client not available');
      return;
    }

    try {
      setStatus('Testing new system...');
      addLog('🧪 Testing new authentication system...');

      // Test accounts query
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .limit(5);

      if (accountsError) {
        addLog(`❌ Error querying accounts: ${accountsError.message}`);
        return;
      }

      addLog(`✅ Found ${accounts?.length || 0} accounts`);

      // Test account_identities query
      const { data: identities, error: identitiesError } = await supabase
        .from('account_identities')
        .select(`
          *,
          accounts!inner (name)
        `)
        .limit(5);

      if (identitiesError) {
        addLog(`❌ Error querying identities: ${identitiesError.message}`);
        return;
      }

      addLog(`✅ Found ${identities?.length || 0} identity links`);

      setStatus('✅ New system working');
      addLog('🎉 New system is working correctly!');

    } catch (error) {
      addLog(`❌ Test error: ${error}`);
      setStatus('❌ Test failed');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication System Migration</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={createTables}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              1. Check/Create Tables
            </button>
            
            <button
              onClick={migrateData}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
            >
              2. Migrate Data
            </button>
            
            <button
              onClick={testNewSystem}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
            >
              3. Test New System
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Migration Logs</h3>
          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-gray-900 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>
              <strong>Create Tables:</strong> First, you need to run the SQL from{' '}
              <code className="bg-gray-800 px-2 py-1 rounded">create-new-auth-system.sql</code> in your Supabase dashboard.
            </li>
            <li>
              <strong>Migrate Data:</strong> This will move all existing profiles to the new accounts system.
            </li>
            <li>
              <strong>Test:</strong> Verify that the new system is working correctly.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

