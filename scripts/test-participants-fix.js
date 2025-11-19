/**
 * Test script to verify chat participants RLS fix
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testParticipantsFix() {
  console.log('🔍 Testing chat participants RLS fix...');
  
  try {
    const userId = '4f04235f-d166-48d9-ae07-a97a6421a328';
    
    // Test 1: Get all participants for user's chats
    console.log('\n1. Testing participant visibility...');
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('user_id', userId);
    
    if (participantsError) {
      console.error('❌ Error fetching user participants:', participantsError);
      return;
    }
    
    console.log(`✅ Found ${participants.length} participant records for user`);
    
    if (participants.length > 0) {
      const chatIds = participants.map(p => p.chat_id);
      console.log('Chat IDs:', chatIds);
      
      // Test 2: Get ALL participants for these chats
      console.log('\n2. Testing ALL participants visibility...');
      const { data: allParticipants, error: allError } = await supabase
        .from('chat_participants')
        .select('*')
        .in('chat_id', chatIds);
      
      if (allError) {
        console.error('❌ Error fetching all participants:', allError);
        return;
      }
      
      console.log(`✅ Found ${allParticipants.length} total participants across all chats`);
      
      // Group by chat
      const participantsByChat = {};
      allParticipants.forEach(p => {
        if (!participantsByChat[p.chat_id]) {
          participantsByChat[p.chat_id] = [];
        }
        participantsByChat[p.chat_id].push(p.user_id);
      });
      
      console.log('\n3. Participants by chat:');
      Object.entries(participantsByChat).forEach(([chatId, userIds]) => {
        const uniqueUserIds = [...new Set(userIds)];
        console.log(`  Chat ${chatId}: ${uniqueUserIds.length} unique participants`);
        console.log(`    User IDs: ${uniqueUserIds.join(', ')}`);
        console.log(`    Has other users: ${uniqueUserIds.length > 1 ? '✅ YES' : '❌ NO'}`);
      });
      
      // Test 3: Check if we can see other users' accounts
      console.log('\n4. Testing account visibility...');
      const allUserIds = [...new Set(allParticipants.map(p => p.user_id))];
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name')
        .in('id', allUserIds);
      
      if (accountsError) {
        console.error('❌ Error fetching accounts:', accountsError);
      } else {
        console.log(`✅ Found ${accounts.length} accounts for participants`);
        console.log('Account names:', accounts.map(a => `${a.id}: ${a.name}`));
      }
      
    } else {
      console.log('❌ No participant records found for user');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testParticipantsFix();





















