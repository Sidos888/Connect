"use client";

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function DebugTablesPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('Ready to test');
  const supabase = getSupabaseClient();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testTables = async () => {
    if (!supabase) {
      addLog('❌ Supabase client not available');
      return;
    }

    try {
      setStatus('Testing tables...');
      addLog('🔄 Testing database tables...');

      // Test accounts table
      addLog('📊 Testing accounts table...');
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .limit(5);

      if (accountsError) {
        addLog(`❌ Accounts table error: ${accountsError.message}`);
      } else {
        addLog(`✅ Accounts table works! Found ${accountsData?.length || 0} records`);
      }

      // Test account_identities table
      addLog('📊 Testing account_identities table...');
      const { data: identitiesData, error: identitiesError } = await supabase
        .from('account_identities')
        .select('*')
        .limit(5);

      if (identitiesError) {
        addLog(`❌ Account_identities table error: ${identitiesError.message}`);
      } else {
        addLog(`✅ Account_identities table works! Found ${identitiesData?.length || 0} records`);
      }

      // Test creating a dummy account
      addLog('📝 Testing account creation...');
      const { data: testAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          name: 'Test User',
          connect_id: 'test_' + Math.random().toString(36).substring(2, 8)
        })
        .select()
        .single();

      if (createError) {
        addLog(`❌ Account creation error: ${createError.message}`);
      } else {
        addLog(`✅ Account creation works! Created account: ${testAccount.id}`);
        
        // Clean up test account
        await supabase
          .from('accounts')
          .delete()
          .eq('id', testAccount.id);
        addLog(`🧹 Cleaned up test account`);
      }

      setStatus('✅ Test complete');
      addLog('🎉 Database test completed!');

    } catch (error) {
      addLog(`❌ Test error: ${error}`);
      setStatus('❌ Test failed');
    }
  };

  const checkUserAccount = async () => {
    if (!supabase) {
      addLog('❌ Supabase client not available');
      return;
    }

    try {
      setStatus('Checking user account...');
      addLog('🔍 Checking for user account efbb7b2a-e6de-42e4-8a2c-a6a4273f157b...');

      // Check account_identities for this user
      const { data: identityData, error: identityError } = await supabase
        .from('account_identities')
        .select(`
          *,
          accounts!inner (*)
        `)
        .eq('auth_user_id', 'efbb7b2a-e6de-42e4-8a2c-a6a4273f157b');

      if (identityError) {
        addLog(`❌ Identity lookup error: ${identityError.message}`);
      } else {
        addLog(`🔍 Found ${identityData?.length || 0} identity records for user`);
        if (identityData && identityData.length > 0) {
          identityData.forEach((identity, index) => {
            addLog(`📋 Identity ${index + 1}: ${identity.method} = ${identity.identifier}`);
            addLog(`📋 Account: ${identity.accounts?.name || 'Unknown'}`);
          });
        }
      }

      // Check accounts table directly
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*');

      if (accountsError) {
        addLog(`❌ Accounts lookup error: ${accountsError.message}`);
      } else {
        addLog(`📊 Total accounts in database: ${accountsData?.length || 0}`);
        if (accountsData && accountsData.length > 0) {
          accountsData.forEach((account, index) => {
            addLog(`👤 Account ${index + 1}: ${account.name} (${account.id})`);
          });
        }
      }

      setStatus('✅ User check complete');

    } catch (error) {
      addLog(`❌ Check error: ${error}`);
      setStatus('❌ Check failed');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Debug</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={testTables}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Test Tables
            </button>
            
            <button
              onClick={checkUserAccount}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
            >
              Check User Account
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
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
      </div>
    </div>
  );
}

