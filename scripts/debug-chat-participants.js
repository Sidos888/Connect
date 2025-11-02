/**
 * Debug script to check chat_participants table structure
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

async function debugChatParticipants() {
  console.log('🔍 Debugging chat_participants table...');
  
  try {
    // 1. Check all participants for a specific user
    const userId = '4f04235f-d166-48d9-ae07-a97a6421a328';
    
    console.log(`\n1. Checking participants for user: ${userId}`);
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('user_id', userId);
    
    if (participantsError) {
      console.error('❌ Error fetching participants:', participantsError);
    } else {
      console.log(`✅ Found ${participants.length} participants for user`);
      console.log('Participants:', participants);
    }
    
    // 2. Check all participants in the system
    console.log('\n2. Checking all participants in system...');
    const { data: allParticipants, error: allError } = await supabase
      .from('chat_participants')
      .select('*')
      .limit(20);
    
    if (allError) {
      console.error('❌ Error fetching all participants:', allError);
    } else {
      console.log(`✅ Found ${allParticipants.length} total participants`);
      
      // Group by chat_id to see participants per chat
      const participantsByChat = {};
      allParticipants.forEach(p => {
        if (!participantsByChat[p.chat_id]) {
          participantsByChat[p.chat_id] = [];
        }
        participantsByChat[p.chat_id].push(p.user_id);
      });
      
      console.log('Participants by chat:');
      Object.entries(participantsByChat).forEach(([chatId, userIds]) => {
        console.log(`  Chat ${chatId}: ${userIds.length} participants - ${userIds.join(', ')}`);
      });
    }
    
    // 3. Check if there are any accounts for other users
    console.log('\n3. Checking accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name')
      .limit(10);
    
    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
    } else {
      console.log(`✅ Found ${accounts.length} accounts`);
      console.log('Accounts:', accounts);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugChatParticipants();
















