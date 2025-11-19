// Test script to verify chat_list_optimized view performance
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function testChatViewPerformance() {
  console.log('🧪 Testing chat_list_optimized view performance...');
  
  try {
    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('chat_list_optimized')
      .select('*')
      .limit(10);
    
    const queryTime = performance.now() - startTime;
    
    if (error) {
      console.error('❌ View test failed:', error);
      return;
    }
    
    console.log(`✅ View query completed in ${queryTime.toFixed(2)}ms`);
    console.log(`📊 Returned ${data?.length || 0} chats`);
    
    if (data && data.length > 0) {
      console.log('🔍 Sample data structure:', {
        chat_id: data[0].chat_id,
        chat_type: data[0].chat_type,
        chat_name: data[0].chat_name,
        other_participants: data[0].other_participants,
        last_message: data[0].last_message
      });
    }
    
    // Performance check
    if (queryTime > 500) {
      console.warn(`⚠️ Query took ${queryTime.toFixed(2)}ms - this is too slow!`);
    } else {
      console.log(`✅ Query performance is good (${queryTime.toFixed(2)}ms < 500ms)`);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run test if called directly
if (typeof window === 'undefined') {
  testChatViewPerformance();
}














