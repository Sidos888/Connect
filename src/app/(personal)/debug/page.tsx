"use client";

import { supabase } from "@/lib/supabaseClient";
import * as React from "react";

// Static export configuration
export const dynamic = 'force-static';

export default function DebugPage() {
  const [status, setStatus] = React.useState<string>("Checking…");

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

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Debug</h1>
      <div className="text-sm text-neutral-700">{status}</div>
      <div className="text-xs text-neutral-500">If not initialized, ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set and restart the dev server.</div>
    </div>
  );
}


