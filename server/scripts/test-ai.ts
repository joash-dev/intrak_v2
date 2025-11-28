import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { getAIConfig } from '../src/config/ai.config';
import { aiService } from '../src/services/aiService';

async function testAI() {
  console.log('🧪 Testing AI Integration...\n');

  // Check configuration
  const config = getAIConfig();
  console.log('📋 Configuration:');
  console.log(`   Provider: ${config.provider}`);
  console.log(`   Model: ${config.model}`);
  console.log(`   Enabled: ${config.enabled}`);
  console.log(`   API Key: ${config.apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Max Tokens: ${config.maxTokens}`);
  console.log(`   Temperature: ${config.temperature}\n`);

  if (!config.enabled) {
    console.log('❌ AI is disabled. Set AI_ENABLED=true in .env');
    return;
  }

  if (!config.apiKey) {
    console.log('❌ API Key is missing. Please set your API key in .env');
    console.log(`   For ${config.provider}: Set ${config.provider === 'openai' ? 'OPENAI_API_KEY' : config.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GEMINI_API_KEY'}`);
    return;
  }

  // Test 1: Simple text generation
  console.log('🧪 Test 1: Simple Text Generation');
  try {
    const testPrompt = 'Write a brief professional evaluation remark (2-3 sentences) for a student intern who received a rating of 4/5 for "Work Attitude". The student has good attendance and submits documents on time.';
    
    console.log('   Generating...');
    const result = await aiService.generateEvaluationRemarks({
      competencyId: 'test',
      competencyTitle: 'Work Attitude',
      rating: 4,
      ratingCriteria: 'Accepts all work assignments; rarely complains; communicates well with superiors and coworkers',
      studentId: 'test-student-id',
      studentName: 'Test Student',
      attendanceData: {
        totalHours: 200,
        onTimePercentage: 95,
        absences: 2,
      },
      documentData: {
        totalSubmitted: 10,
        approved: 9,
        rejected: 1,
      },
    });

    console.log('   ✅ Success!');
    console.log('   Generated Remarks:');
    console.log(`   "${result}"\n`);
  } catch (error: any) {
    console.log('   ❌ Failed!');
    console.log(`   Error: ${error.message}\n`);
    return;
  }

  // Test 2: Document Feedback
  console.log('🧪 Test 2: Document Feedback Generation');
  try {
    const feedback = await aiService.generateDocumentFeedback({
      documentType: 'Weekly Report',
      documentTitle: 'Week 1 Report',
      action: 'approve',
      studentName: 'Test Student',
      studentHistory: {
        previousSubmissions: 5,
        approvalRate: 0.9,
      },
    });

    console.log('   ✅ Success!');
    console.log('   Generated Feedback:');
    console.log(`   "${feedback}"\n`);
  } catch (error: any) {
    console.log('   ❌ Failed!');
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 3: Attendance Note
  console.log('🧪 Test 3: Attendance Note Generation');
  try {
    const note = await aiService.generateAttendanceNote({
      studentName: 'Test Student',
      date: '2024-01-15',
      timeIn: '2024-01-15T08:30:00Z',
      timeOut: '2024-01-15T17:00:00Z',
      action: 'approve',
      location: 'Company Office',
      attendanceHistory: {
        onTimePercentage: 95,
        recentAbsences: 0,
      },
    });

    console.log('   ✅ Success!');
    console.log('   Generated Note:');
    console.log(`   "${note}"\n`);
  } catch (error: any) {
    console.log('   ❌ Failed!');
    console.log(`   Error: ${error.message}\n`);
  }

  console.log('✅ AI Integration Test Complete!');
  console.log('\n💡 If all tests passed, your AI integration is working correctly.');
  console.log('   You can now use AI features in the application.');
}

// Run the test
testAI().catch((error) => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});


