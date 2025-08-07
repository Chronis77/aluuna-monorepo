import { MemoryProcessingService, ProcessingContext, StructuredResponse } from './memoryProcessingService';

/**
 * Test file demonstrating the Memory Processing System
 * This file shows how to use the system with sample data
 */

// Sample structured response from OpenAI
const sampleStructuredResponse: StructuredResponse = {
  session_memory_commit: "Alex wants to respond instead of snapping in tense moments with Jamie.",
  long_term_memory_commit: "Alex is gaining awareness of their reactivity triggers and practicing emotional pause techniques.",
  response: "It's so meaningful that you're noticing the desire to respond rather than react. One thing to try is anchoring yourself with breath or sensation when tension rises. For example, feel your feet or your breath for just one breath before replying. Would you like to explore what that moment feels like inside, so we can slow it down together?",
  wellness_judgement: "growing",
  new_memory_inference: {
    inner_parts: {
      name: "The Defender",
      role: "Protector",
      tone: "aggressive",
      description: "Snaps to protect from feeling powerless or unheard."
    },
    new_stuck_point: "Alex equates being calm with being weak or invisible.",
    crisis_signal: false,
    value_conflict: "Wants emotional honesty but avoids vulnerability to prevent judgment.",
    coping_tool_used: "breathing"
  }
};

// Sample processing context
const sampleContext: ProcessingContext = {
  userId: "test-user-123",
  sessionId: "test-session-456",
  sessionGroupId: "test-group-789",
  currentSessionContext: {
    userProfile: {
      name: "Alex",
      themes: ["divorce", "parenting stress", "anxiety"]
    }
  }
};

/**
 * Test the memory processing system
 */
export async function testMemoryProcessing() {
  console.log('🧪 Testing Memory Processing System');
  console.log('====================================');

  try {
    // Test 1: Process structured response
    console.log('\n📝 Test 1: Processing structured response...');
    await MemoryProcessingService.processStructuredResponse(
      sampleStructuredResponse,
      sampleContext
    );
    console.log('✅ Test 1 passed: Structured response processed successfully');

    // Test 2: Retrieve memory profile
    console.log('\n🧠 Test 2: Retrieving memory profile...');
    const memoryProfile = await MemoryProcessingService.getMemoryProfile(sampleContext.userId);
    console.log('✅ Test 2 passed: Memory profile retrieved');
    console.log('Memory Profile:', memoryProfile);

    // Test 3: Retrieve insights
    console.log('\n💡 Test 3: Retrieving insights...');
    const insights = await MemoryProcessingService.getUserInsights(sampleContext.userId, 5);
    console.log('✅ Test 3 passed: Insights retrieved');
    console.log('Recent Insights:', insights);

    // Test 4: Retrieve inner parts
    console.log('\n🎭 Test 4: Retrieving inner parts...');
    const innerParts = await MemoryProcessingService.getUserInnerParts(sampleContext.userId);
    console.log('✅ Test 4 passed: Inner parts retrieved');
    console.log('Inner Parts:', innerParts);

    console.log('\n🎉 All tests passed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Test crisis detection
 */
export async function testCrisisDetection() {
  console.log('\n🚨 Testing Crisis Detection');
  console.log('============================');

  try {
    // Create a crisis response
    const crisisResponse: StructuredResponse = {
      session_memory_commit: "User expressed severe distress and hopelessness.",
      long_term_memory_commit: "User is experiencing a mental health crisis requiring immediate attention.",
      response: "I hear how much pain you're in right now. You're not alone, and there are people who want to help you. Can you tell me more about what's happening?",
      wellness_judgement: "crisis",
      new_memory_inference: {
        inner_parts: null,
        new_stuck_point: null,
        crisis_signal: true,
        value_conflict: null,
        coping_tool_used: null
      }
    };

    console.log('📝 Processing crisis response...');
    await MemoryProcessingService.processStructuredResponse(
      crisisResponse,
      sampleContext
    );
    console.log('✅ Crisis detection test completed');

  } catch (error) {
    console.error('❌ Crisis detection test failed:', error);
  }
}

/**
 * Test duplicate prevention
 */
export async function testDuplicatePrevention() {
  console.log('\n🔄 Testing Duplicate Prevention');
  console.log('================================');

  try {
    // Process the same response twice
    console.log('📝 Processing response first time...');
    await MemoryProcessingService.processStructuredResponse(
      sampleStructuredResponse,
      sampleContext
    );

    console.log('📝 Processing response second time...');
    await MemoryProcessingService.processStructuredResponse(
      sampleStructuredResponse,
      sampleContext
    );

    console.log('✅ Duplicate prevention test completed - check logs for deduplication messages');

  } catch (error) {
    console.error('❌ Duplicate prevention test failed:', error);
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Running Memory Processing System Tests');
  console.log('==========================================');

  const results = {
    basicProcessing: false,
    crisisDetection: false,
    duplicatePrevention: false
  };

  try {
    // Run basic processing test
    results.basicProcessing = await testMemoryProcessing();

    // Run crisis detection test
    await testCrisisDetection();
    results.crisisDetection = true;

    // Run duplicate prevention test
    await testDuplicatePrevention();
    results.duplicatePrevention = true;

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Basic Processing: ${results.basicProcessing ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Crisis Detection: ${results.crisisDetection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Duplicate Prevention: ${results.duplicatePrevention ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);

    return allPassed;

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return false;
  }
}

// Example usage:
/*
// Run individual tests
await testMemoryProcessing();
await testCrisisDetection();
await testDuplicatePrevention();

// Or run all tests
await runAllTests();
*/ 