// Chat Performance Test
// This file tests the performance difference between old and new chat loading methods

import { getSupabaseClient } from './supabaseClient';
import { SimpleChatService } from './simpleChatService';

export async function testChatLoadingPerformance() {
  console.log('🧪 Starting chat loading performance test...');
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('❌ No Supabase client available');
    return;
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No authenticated user');
    return;
  }

  // Get account
  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!account) {
    console.error('❌ No account found');
    return;
  }

  const chatService = new SimpleChatService(supabase, () => account);

  // Test 1: Fast method (if available)
  console.log('🚀 Testing fast method...');
  const fastStart = performance.now();
  
  try {
    const fastResult = await (chatService as any).getUserChatsFast?.();
    const fastEnd = performance.now();
    const fastTime = fastEnd - fastStart;
    
    console.log(`✅ Fast method: ${fastTime.toFixed(2)}ms`);
    console.log(`   Chats loaded: ${fastResult?.chats?.length || 0}`);
    console.log(`   Error: ${fastResult?.error?.message || 'None'}`);
  } catch (error) {
    console.log(`❌ Fast method failed: ${error}`);
  }

  // Test 2: Legacy method
  console.log('🐌 Testing legacy method...');
  const legacyStart = performance.now();
  
  try {
    const legacyResult = await chatService.getUserChats();
    const legacyEnd = performance.now();
    const legacyTime = legacyEnd - legacyStart;
    
    console.log(`✅ Legacy method: ${legacyTime.toFixed(2)}ms`);
    console.log(`   Chats loaded: ${legacyResult?.chats?.length || 0}`);
    console.log(`   Error: ${legacyResult?.error?.message || 'None'}`);
  } catch (error) {
    console.log(`❌ Legacy method failed: ${error}`);
  }

  console.log('🧪 Performance test complete!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testChatPerformance = testChatLoadingPerformance;
}






