// Test Chat Loading Performance
// Run this in browser console after signing in

import { getSupabaseClient } from './supabaseClient';
import { SimpleChatService } from './simpleChatService';

export async function testChatLoading() {
  console.log('🧪 Testing chat loading performance...');
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('❌ No Supabase client');
    return;
  }

  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('❌ No session:', sessionError);
    return;
  }

  console.log('✅ Session found:', session.user.id);

  // Get account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (accountError || !account) {
    console.error('❌ No account:', accountError);
    return;
  }

  console.log('✅ Account found:', account.name);

  const chatService = new SimpleChatService(supabase, () => account);

  // Test 1: Check if optimized view exists
  console.log('🔍 Testing if chat_list_optimized view exists...');
  const { data: viewTest, error: viewError } = await supabase
    .from('chat_list_optimized')
    .select('*')
    .limit(1);

  if (viewError) {
    console.log('❌ Optimized view not found:', viewError.message);
    console.log('💡 Run: node scripts/apply-chat-optimizations.js');
  } else {
    console.log('✅ Optimized view exists!');
  }

  // Test 2: Fast method
  console.log('🚀 Testing getUserChatsFast...');
  const fastStart = performance.now();
  
  try {
    const fastResult = await (chatService as any).getUserChatsFast?.();
    const fastEnd = performance.now();
    const fastTime = fastEnd - fastStart;
    
    console.log(`✅ Fast method: ${fastTime.toFixed(2)}ms`);
    console.log(`   Chats: ${fastResult?.chats?.length || 0}`);
    console.log(`   Error: ${fastResult?.error?.message || 'None'}`);
  } catch (error) {
    console.log(`❌ Fast method failed: ${error}`);
  }

  // Test 3: Legacy method
  console.log('🐌 Testing getUserChats (legacy)...');
  const legacyStart = performance.now();
  
  try {
    const legacyResult = await chatService.getUserChats();
    const legacyEnd = performance.now();
    const legacyTime = legacyEnd - legacyStart;
    
    console.log(`✅ Legacy method: ${legacyTime.toFixed(2)}ms`);
    console.log(`   Chats: ${legacyResult?.chats?.length || 0}`);
    console.log(`   Error: ${legacyResult?.error?.message || 'None'}`);
  } catch (error) {
    console.log(`❌ Legacy method failed: ${error}`);
  }

  console.log('🧪 Test complete!');
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).testChatLoading = testChatLoading;
  console.log('💡 Run testChatLoading() in console to test performance');
}






