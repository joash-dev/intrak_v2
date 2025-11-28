import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { getAIConfig } from '../src/config/ai.config';
import { aiService } from '../src/services/aiService';

async function testSimple() {
  console.log('🧪 Testing AI with Simple Request...\n');

  const config = getAIConfig();
  console.log('Config:', {
    provider: config.provider,
    model: config.model,
    enabled: config.enabled,
    hasKey: !!config.apiKey,
  });

  if (!config.enabled || !config.apiKey) {
    console.log('❌ AI not configured properly');
    return;
  }

  try {
    console.log('Testing evaluation remarks generation...');
    const result = await aiService.generateEvaluationRemarks({
      competencyId: 'test',
      competencyTitle: 'Work Attitude',
      rating: 4,
      ratingCriteria: 'Accepts all work assignments; rarely complains',
      studentId: 'test-id',
      studentName: 'Test Student',
    });

    console.log('✅ Success!');
    console.log('Generated:', result);
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    console.log('Full error:', error);
  }
}

testSimple();


