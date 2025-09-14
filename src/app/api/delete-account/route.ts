import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    console.log('Delete API: Received deletion request for user:', userId);
    console.log('Delete API: Service role key available:', !!supabaseServiceKey);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Delete API: Invalid UUID format:', userId);
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // If we have a service role key, use it for admin operations
    if (supabaseServiceKey) {
      console.log('Delete API: Using service role key for admin deletion');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Delete from profiles table first
      console.log('Delete API: Deleting from profiles table...');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        console.error('Delete API: Profile deletion failed:', profileError);
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
      }
      
      console.log('Delete API: Profile deleted successfully, now deleting auth user...');
      
      // Delete from auth.users table
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Delete API: Auth user deletion failed:', authError);
        return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
      }
      
      console.log('Delete API: Account deleted successfully with service role');
      return NextResponse.json({ success: true });
    } else {
      console.log('Delete API: No service role key available');
      console.log('Delete API: Service role key env var:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }
  } catch (error) {
    console.error('Delete API: Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
