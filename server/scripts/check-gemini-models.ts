import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function checkModels() {
  if (!GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY not found in .env');
    return;
  }

  console.log('🔍 Checking available Gemini models...\n');

  // Try v1 API
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data: any = await response.json();
    
    if (data.models) {
      console.log('✅ Available models (v1 API):');
      data.models.forEach((model: any) => {
        console.log(`   - ${model.name} (${model.displayName || 'N/A'})`);
      });
    } else {
      console.log('❌ No models found in v1 API');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log('❌ Error checking v1 API:', error.message);
  }

  // Try v1beta API
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data: any = await response.json();
    
    if (data.models) {
      console.log('\n✅ Available models (v1beta API):');
      data.models.forEach((model: any) => {
        console.log(`   - ${model.name} (${model.displayName || 'N/A'})`);
      });
    } else {
      console.log('\n❌ No models found in v1beta API');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log('\n❌ Error checking v1beta API:', error.message);
  }

  // Test a simple generation with gemini-pro
  console.log('\n🧪 Testing generation with gemini-pro...');
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say hello in one sentence.' }]
        }]
      })
    });

    if (response.ok) {
      const data: any = await response.json();
      console.log('✅ Generation test successful!');
      console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      const error = await response.text();
      console.log('❌ Generation test failed');
      console.log('Error:', error);
    }
  } catch (error: any) {
    console.log('❌ Generation test error:', error.message);
  }
}

checkModels();


