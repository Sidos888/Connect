"use client";

import { useAuth } from "@/lib/authContext";
import * as React from "react";

// Static export configuration
export const dynamic = 'force-static';

export default function DebugPage() {
  const { user, supabase, cleanupDuplicateAccounts } = useAuth();
  const [status, setStatus] = React.useState<string>("Checking…");
  const [cleanupResult, setCleanupResult] = React.useState<any>(null);
  const [debugResult, setDebugResult] = React.useState<any>(null);

  React.useEffect(() => {
    const active = !!supabase;
    if (!active) {
      setStatus("Supabase client not initialized. Check .env.local and restart dev.");
      return;
    }
    supabase!.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          setStatus(`Client initialized ✓ — auth check error: ${error.message}`);
        } else {
          setStatus(`Client initialized ✓ — session: ${data.session ? "present" : "none"}`);
        }
      })
      .catch((e) => setStatus(`Client initialized ✓ — auth check error: ${String(e)}`));
  }, []);

  const runCleanup = async () => {
    try {
      console.log('Running duplicate account cleanup...');
      setCleanupResult({ loading: true, message: 'Cleaning up duplicate accounts...' });
      
      const { error } = await cleanupDuplicateAccounts();
      
      if (error) {
        console.error('Cleanup error:', error);
        setCleanupResult({ success: false, error: error.message });
      } else {
        console.log('Cleanup completed successfully');
        setCleanupResult({ success: true, message: 'Duplicate accounts cleaned up successfully!' });
      }
    } catch (err) {
      console.error('Cleanup error:', err);
      setCleanupResult({ success: false, error: String(err) });
    }
  };

  const debugAuth = async () => {
    try {
      console.log('=== COMPREHENSIVE AUTH DEBUG ===');
      setDebugResult({ loading: true, message: 'Running comprehensive debug...' });
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        currentUser: user ? { id: user.id, email: user.email, phone: user.phone } : null,
        tests: {}
      };

      // Test 1: Check if Sid profile exists
      console.log('🔍 Test 1: Checking for Sid Farquharson profile...');
      const { data: sidProfile, error: sidError } = await supabase
        .from('profiles')
        .select('*')
        .eq('full_name', 'Sid Farquharson')
        .maybeSingle();
      
      debugInfo.tests.sidProfileCheck = {
        found: !!sidProfile,
        error: sidError?.message,
        profile: sidProfile ? { id: sidProfile.id, name: sidProfile.full_name, email: sidProfile.email, phone: sidProfile.phone } : null
      };

      // Test 2: Check phone lookup directly
      console.log('🔍 Test 2: Testing phone lookup directly...');
      const { data: phoneProfile, error: phoneError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', '+61466310826')
        .maybeSingle();
      debugInfo.tests.phoneCheck = {
        found: !!phoneProfile,
        error: phoneError?.message,
        profile: phoneProfile
      };

      // Test 3: Check email lookup directly
      console.log('🔍 Test 3: Testing email lookup directly...');
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'sidfarquharson@gmail.com')
        .maybeSingle();
      debugInfo.tests.emailCheck = {
        found: !!emailProfile,
        error: emailError?.message,
        profile: emailProfile
      };

      // Test 4: Current session
      console.log('🔍 Test 4: Checking current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      debugInfo.tests.currentSession = {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: sessionError?.message
      };

      console.log('=== DEBUG RESULTS ===', debugInfo);
      setDebugResult({ success: true, data: debugInfo });
      
    } catch (err) {
      console.error('Debug error:', err);
      setDebugResult({ success: false, error: String(err) });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Debug</h1>
      
      <div>
        <div className="text-sm text-neutral-700">{status}</div>
        <div className="text-xs text-neutral-500">If not initialized, ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set and restart the dev server.</div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold">User State:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(user ? { id: user.id, email: user.email, phone: user.phone } : 'Not signed in', null, 2)}
        </pre>
      </div>
      
      <div className="space-y-4">
        <button 
          onClick={debugAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
        >
          🔍 Debug Authentication
        </button>
        
        <button 
          onClick={runCleanup}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cleanup Duplicate Accounts
        </button>
      </div>
      
      {debugResult && (
        <div>
          <h2 className="text-lg font-semibold">Debug Results:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm max-h-96 overflow-auto">
            {JSON.stringify(debugResult, null, 2)}
          </pre>
        </div>
      )}

      {cleanupResult && (
        <div>
          <h2 className="text-lg font-semibold">Cleanup Result:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(cleanupResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}


