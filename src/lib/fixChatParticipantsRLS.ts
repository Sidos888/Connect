/**
 * Fix for chat_participants RLS policy causing 500 errors
 * This script can be run directly in the browser console
 */

export async function fixChatParticipantsRLS() {
  console.log('🔧 Fixing chat_participants RLS policy...');
  
  // Get the Supabase client
  const authContext = (window as any).__authContext;
  if (!authContext?.supabase) {
    console.error('❌ No Supabase client found. Please make sure you\'re logged in.');
    return;
  }
  
  const supabase = authContext.supabase;
  
  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ User not authenticated');
    return;
  }
  
  console.log('✅ User authenticated:', user.id);
  console.log('\n📝 The 500 error is caused by RLS policies on chat_participants.');
  console.log('📝 You need to apply the fix from: sql/fix_chat_participants_rls_proper.sql');
  console.log('\n💡 To apply the fix:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of sql/fix_chat_participants_rls_proper.sql');
  console.log('4. Run the SQL script');
  console.log('\n🔍 The fix will:');
  console.log('   - Create a helper function to check if user is in a chat (avoiding recursion)');
  console.log('   - Update RLS policies to allow viewing ALL participants in chats user is part of');
  console.log('   - Add performance indexes');
  
  // Try to test the current state
  console.log('\n🧪 Testing current chat_participants access...');
  
  try {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing chat_participants:', error.message);
      console.log('   This confirms the RLS policy issue needs to be fixed.');
    } else {
      console.log('✅ Can access own participant records');
      console.log('   Found', data?.length || 0, 'chat(s)');
      
      if (data && data.length > 0) {
        // Try to fetch all participants for this chat
        const chatId = data[0].chat_id;
        console.log('\n🧪 Testing access to other participants in chat:', chatId);
        
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('user_id, chat_id')
          .eq('chat_id', chatId);
        
        if (participantsError) {
          console.error('❌ Error accessing other participants:', participantsError.message);
          console.log('   This is the root cause of the 500 error!');
          console.log('   RLS policy is blocking access to other participants.');
        } else {
          console.log('✅ Can access other participants!');
          console.log('   Found', participants?.length || 0, 'participant(s) in this chat');
          console.log('   The RLS policy might already be fixed!');
        }
      }
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📋 SUMMARY:');
  console.log('   The 500 error is caused by RLS policies preventing');
  console.log('   users from seeing other participants in their chats.');
  console.log('   Apply the SQL fix from:');
  console.log('   sql/fix_chat_participants_rls_proper.sql');
  console.log('═══════════════════════════════════════════════════');
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).fixChatParticipantsRLS = fixChatParticipantsRLS;
}


























