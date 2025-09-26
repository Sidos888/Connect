"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";

export default function DebugAuthPage() {
  const { supabase, user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDebugData = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Get all accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (accountsError) {
        console.error('Error loading accounts:', accountsError);
      } else {
        setAccounts(accountsData || []);
      }

      // Get all identities
      const { data: identitiesData, error: identitiesError } = await supabase
        .from('account_identities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (identitiesError) {
        console.error('Error loading identities:', identitiesError);
      } else {
        setIdentities(identitiesData || []);
      }
    } catch (error) {
      console.error('Error in loadDebugData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Auth Debug Dashboard</h1>
        
        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email || 'None'}</p>
              <p><strong>Phone:</strong> {user.phone || 'None'}</p>
              <p><strong>Created:</strong> {user.created_at}</p>
            </div>
          ) : (
            <p className="text-gray-500">No user authenticated</p>
          )}
        </div>

        {/* Controls */}
        <div className="mb-6">
          <button
            onClick={loadDebugData}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accounts Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Accounts ({accounts.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Connect ID</th>
                      <th className="text-left p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-xs">
                          {account.id.substring(0, 8)}...
                        </td>
                        <td className="p-2">{account.name || 'No name'}</td>
                        <td className="p-2">{account.connect_id || 'None'}</td>
                        <td className="p-2 text-xs">
                          {new Date(account.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Identities Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Account Identities ({identities.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Account ID</th>
                      <th className="text-left p-2">Auth User ID</th>
                      <th className="text-left p-2">Method</th>
                      <th className="text-left p-2">Identifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {identities.map((identity, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-xs">
                          {identity.account_id?.substring(0, 8)}...
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {identity.auth_user_id?.substring(0, 8)}...
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            identity.method === 'email' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {identity.method}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {identity.identifier}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

