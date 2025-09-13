'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState('Loading...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        console.log('Testing Supabase connection...');
        
        // Check environment variables
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        console.log('Environment variables:', {
          url: url ? 'Set' : 'Missing',
          key: key ? 'Set' : 'Missing'
        });

        if (!url || !key) {
          setStatus('❌ Missing environment variables');
          setDetails({ url: !!url, key: !!key });
          return;
        }

        // Test Supabase client
        const supabase = getSupabaseClient();
        console.log('Supabase client:', supabase);

        if (!supabase) {
          setStatus('❌ Failed to create Supabase client');
          return;
        }

        // Test a simple query
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        console.log('Test query result:', { data, error });

        if (error) {
          setStatus('❌ Database query failed');
          setDetails({ error: error.message, code: error.code });
        } else {
          setStatus('✅ Supabase connection successful!');
          setDetails({ data, error });
        }
      } catch (err) {
        console.error('Supabase test error:', err);
        setStatus('❌ Unexpected error');
        setDetails({ error: err.message });
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-lg">{status}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>

        <div className="mt-6">
          <a 
            href="/" 
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to App
          </a>
        </div>
      </div>
    </div>
  );
}
