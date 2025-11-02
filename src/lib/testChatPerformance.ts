/**
 * Comprehensive test script for chat loading performance
 * Run this in the browser console to test the complete flow
 */

export async function testChatPerformance() {
  console.log('🧪 Starting comprehensive chat performance test...');
  
  const results = {
    authTiming: { success: false, time: 0, error: null as string | null },
    chatLoading: { success: false, time: 0, chatCount: 0, error: null as string | null },
    profileData: { success: false, hasNames: false, hasAvatars: false, error: null as string | null },
    overall: { success: false, totalTime: 0 }
  };
  
  const startTime = performance.now();
  
  try {
    // Test 1: Authentication timing
    console.log('🔍 Test 1: Authentication timing...');
    const authStartTime = performance.now();
    
    const authContext = (window as any).__authContext;
    if (!authContext) {
      throw new Error('No auth context found');
    }
    
    const { user, account, chatService } = authContext;
    
    if (!user || !account) {
      throw new Error('User not authenticated');
    }
    
    if (user.id !== account.id) {
      throw new Error('User ID mismatch between auth and account');
    }
    
    results.authTiming = {
      success: true,
      time: performance.now() - authStartTime,
      error: null
    };
    
    console.log('✅ Authentication test passed:', {
      time: `${results.authTiming.time.toFixed(2)}ms`,
      userId: user.id,
      accountId: account.id
    });
    
    // Test 2: Chat loading performance
    console.log('🔍 Test 2: Chat loading performance...');
    const chatStartTime = performance.now();
    
    if (!chatService) {
      throw new Error('No chat service available');
    }
    
    const chatResult = await chatService.getUserChatsFast();
    
    results.chatLoading = {
      success: !chatResult.error,
      time: performance.now() - chatStartTime,
      chatCount: chatResult.chats?.length || 0,
      error: chatResult.error?.message || null
    };
    
    if (chatResult.error) {
      console.error('❌ Chat loading failed:', chatResult.error);
    } else {
      console.log('✅ Chat loading test passed:', {
        time: `${results.chatLoading.time.toFixed(2)}ms`,
        chatCount: results.chatLoading.chatCount,
        performance: results.chatLoading.time < 1000 ? 'Fast' : results.chatLoading.time < 3000 ? 'Slow' : 'Very Slow'
      });
    }
    
    // Test 3: Profile data quality
    console.log('🔍 Test 3: Profile data quality...');
    
    if (chatResult.chats && chatResult.chats.length > 0) {
      const sampleChat = chatResult.chats[0];
      const hasNames = sampleChat.participants?.some(p => p.name && p.name.trim() !== '') || false;
      const hasAvatars = sampleChat.participants?.some(p => p.profile_pic && p.profile_pic.trim() !== '') || false;
      
      results.profileData = {
        success: true,
        hasNames,
        hasAvatars,
        error: null
      };
      
      console.log('✅ Profile data test passed:', {
        hasNames,
        hasAvatars,
        sampleChat: {
          id: sampleChat.id,
          name: sampleChat.name,
          type: sampleChat.type,
          participantCount: sampleChat.participants?.length || 0,
          hasLastMessage: !!sampleChat.last_message
        }
      });
    } else {
      results.profileData = {
        success: true,
        hasNames: false,
        hasAvatars: false,
        error: 'No chats to test'
      };
      console.log('ℹ️ No chats available for profile data test');
    }
    
    // Test 4: Store state
    console.log('🔍 Test 4: Store state...');
    
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
    
    // Overall results
    results.overall = {
      success: results.authTiming.success && results.chatLoading.success && results.profileData.success,
      totalTime: performance.now() - startTime
    };
    
    // Summary
    console.log('\n📊 PERFORMANCE TEST SUMMARY:');
    console.log('================================');
    console.log(`Authentication: ${results.authTiming.success ? '✅' : '❌'} (${results.authTiming.time.toFixed(2)}ms)`);
    console.log(`Chat Loading: ${results.chatLoading.success ? '✅' : '❌'} (${results.chatLoading.time.toFixed(2)}ms)`);
    console.log(`Profile Data: ${results.profileData.success ? '✅' : '❌'} (Names: ${results.profileData.hasNames ? '✅' : '❌'}, Avatars: ${results.profileData.hasAvatars ? '✅' : '❌'})`);
    console.log(`Overall: ${results.overall.success ? '✅' : '❌'} (${results.overall.totalTime.toFixed(2)}ms)`);
    
    if (results.overall.success) {
      console.log('\n🎉 All tests passed! Chat loading should be working properly.');
      
      if (results.chatLoading.time < 1000) {
        console.log('🚀 Excellent performance! Chat loading is very fast.');
      } else if (results.chatLoading.time < 3000) {
        console.log('⚠️ Good performance, but could be faster.');
      } else {
        console.log('🐌 Chat loading is slow. Consider applying database optimizations.');
      }
    } else {
      console.log('\n❌ Some tests failed. Check the errors above.');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    results.overall = {
      success: false,
      totalTime: performance.now() - startTime
    };
    return results;
  }
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testChatPerformance = testChatPerformance;
}
















