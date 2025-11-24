/**
 * Test script to verify authentication flow and chat loading performance
 * This can be run in the browser console to debug timing issues
 */

export async function testAuthFlow() {
  console.log('🧪 Starting authentication flow test...');
  
  // Test 1: Check if user is logged in immediately after OTP verification
  console.log('🔍 Test 1: Checking authentication state...');
  
  // Get the current auth context
  const authContext = (window as any).__authContext;
  if (!authContext) {
    console.error('❌ No auth context found. Make sure you\'re logged in.');
    return;
  }
  
  const { user, account, chatService } = authContext;
  console.log('Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    hasAccount: !!account,
    accountId: account?.id,
    hasChatService: !!chatService,
    idsMatch: user?.id === account?.id
  });
  
  if (!user || !account) {
    console.error('❌ User not authenticated. Please log in first.');
    return;
  }
  
  // Test 2: Check chat loading performance
  console.log('🔍 Test 2: Testing chat loading performance...');
  
  const startTime = performance.now();
  
  try {
    const result = await chatService.getUserChatsFast();
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    console.log('Chat loading result:', {
      success: !result.error,
      error: result.error?.message,
      chatCount: result.chats?.length || 0,
      loadTime: `${loadTime.toFixed(2)}ms`,
      performance: loadTime < 1000 ? '✅ Fast' : loadTime < 3000 ? '⚠️ Slow' : '❌ Very Slow'
    });
    
    if (result.chats && result.chats.length > 0) {
      console.log('Sample chat:', {
        id: result.chats[0].id,
        name: result.chats[0].name,
        type: result.chats[0].type,
        participants: result.chats[0].participants?.length || 0,
        hasLastMessage: !!result.chats[0].last_message
      });
    }
    
  } catch (error) {
    console.error('❌ Chat loading failed:', error);
  }
  
  // Test 3: Check store state
  console.log('🔍 Test 3: Checking store state...');
  
  const store = (window as any).__appStore;
  if (store) {
    const state = store.getState();
    console.log('Store state:', {
      isHydrated: state.isHydrated,
      conversationCount: state.conversations?.length || 0,
      hasPersonalProfile: !!state.personalProfile,
      personalProfileId: state.personalProfile?.id
    });
  }
  
  console.log('✅ Authentication flow test complete!');
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testAuthFlow = testAuthFlow;
}






















