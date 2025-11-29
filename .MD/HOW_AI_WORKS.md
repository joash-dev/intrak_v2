# How the AI Feature Works in INTRAK

## 🎯 Overview

The AI feature uses **Google Gemini 2.5 Flash** (or OpenAI/Anthropic) to automatically generate professional text content for various parts of the OJT management system. It helps supervisors, instructors, and coordinators write evaluation remarks, feedback, and summaries faster.

## 🏗️ Architecture

### 1. **Configuration Layer** (`server/src/config/ai.config.ts`)
- Reads environment variables to determine:
  - Which AI provider to use (Gemini, OpenAI, or Anthropic)
  - API key for authentication
  - Model name (e.g., `gemini-2.5-flash`)
  - Token limits and temperature settings
- Checks if AI is enabled (`AI_ENABLED=true`)

### 2. **AI Service Layer** (`server/src/services/aiService.ts`)
- **Abstraction layer** that works with any AI provider
- Builds prompts with context (student data, ratings, attendance, etc.)
- Calls the appropriate AI provider API
- Handles errors and token limits
- Returns generated text

### 3. **Controller Layer** (`server/src/controllers/ai.controller.ts`)
- Receives HTTP requests from frontend
- Validates input data
- Fetches student data from database (attendance, documents, etc.)
- Calculates metrics (hours worked, on-time percentage, etc.)
- Calls AI service with context
- Returns generated content

### 4. **Frontend Components**
- **AIGenerateButton** - The button users click to generate content
- **aiService** - Frontend service that calls the API
- Various pages use it (evaluations, documents, attendance, etc.)

## 🔄 How It Works - Step by Step

### Example: Generating Evaluation Remarks

1. **User clicks "Generate with AI" button**
   - Button is in evaluation form (Supervisor/Instructor view)
   - User has filled in ratings for competencies

2. **Frontend sends request**
   ```
   POST /api/ai/evaluation-remarks
   {
     competencyId: "123",
     rating: 4,
     studentId: "abc",
     competencyTitle: "Work Attitude"
   }
   ```

3. **Backend controller receives request**
   - Validates required fields
   - Fetches student data from database:
     - Student name
     - Attendance logs (to calculate hours, on-time %)
     - Document submissions (to see approval rate)
   - Calculates metrics:
     - Total hours: 200 hours
     - On-time percentage: 95%
     - Documents: 10 submitted, 9 approved

4. **AI Service builds prompt**
   ```
   "Student: John Doe
    Rating: 4/5 for Work Attitude
    Criteria: Accepts all work assignments...
    Attendance: 200 hours, 95% on-time
    Documents: 10 submitted, 9 approved
    
    Generate professional evaluation remarks..."
   ```

5. **Calls AI Provider API**
   - Sends prompt to Gemini API
   - Waits for response (usually 2-5 seconds)
   - Receives generated text

6. **Returns to frontend**
   - Generated text appears in textarea
   - User can edit it before saving

## 🎨 AI Features Available

### 1. **Evaluation Remarks** (Supervisors)
- Generates remarks for individual competency ratings
- Uses student's attendance and document history for context

### 2. **Document Feedback** (Instructors/Coordinators)
- Generates approval/rejection feedback
- Considers student's submission history

### 3. **Attendance Notes** (Supervisors/Instructors)
- Generates verification notes when approving/rejecting attendance
- Includes context about attendance patterns

### 4. **Weekly Report Summary** (Students)
- Expands student's weekly notes into professional summary
- Synthesizes tasks and learning outcomes

### 5. **Overall Comments** (Supervisors)
- Generates comprehensive overall evaluation comments
- Synthesizes all competency ratings

### 6. **Form 18 Comments** (Supervisors)
- Generates comments for Form 18 evaluation
- Uses all rating categories

### 7. **Instructor Evaluation Comments** (Instructors)
- Generates evaluation comments from instructor ratings

### 8. **Announcement Content** (Coordinators/Admins)
- Generates announcement content based on title and audience

## ⚙️ Configuration

### Environment Variables (in Render Dashboard)

```env
AI_ENABLED=true                    # Enable/disable AI
AI_PROVIDER=gemini                 # Provider: gemini, openai, or anthropic
GEMINI_API_KEY=your-api-key        # Your Gemini API key
AI_MODEL=gemini-2.5-flash          # Model name
AI_MAX_TOKENS=3000                 # Max tokens (increase if you get errors)
AI_TEMPERATURE=0.7                 # Creativity (0-1, lower = more focused)
```

### How Token Limits Work

- **Tokens** = Units of text (roughly 4 characters = 1 token)
- **Gemini 2.5 Flash** uses "thinking tokens" before generating
- Example: If thinking uses 1999 tokens and max is 2000, you get no output
- **Solution**: Set `AI_MAX_TOKENS=3000` or higher

## 🔒 Security & Rate Limiting

- **Authentication**: All AI endpoints require user login
- **Authorization**: Role-based access (only specific roles can use each feature)
- **Rate Limiting**: 5 requests per minute per user (prevents abuse)
- **API Key**: Stored securely in environment variables (never exposed to frontend)

## 💰 Cost Considerations

### Gemini 2.5 Flash (Current Setup)
- **Very cost-effective**: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
- **Example costs**:
  - 100 evaluation remarks: ~$0.01
  - 500 document feedbacks: ~$0.05
  - 1,000 attendance notes: ~$0.02

### Token Usage
- Each request uses ~500-2000 tokens
- With rate limiting (5/min), max cost is very low
- Typical monthly cost: $1-5 for active system

## 🐛 Troubleshooting

### "AI service is not configured"
- Set `AI_ENABLED=true` in Render environment variables
- Add API key (`GEMINI_API_KEY=...`)

### "Response exceeded token limit"
- Increase `AI_MAX_TOKENS` to 3000 or 4000
- Gemini uses "thinking tokens" that count toward the limit

### "AI returned empty response"
- Check API key is valid
- Verify model name is correct
- Check server logs for detailed errors

### AI button not showing
- Verify `AI_ENABLED=true` in Render
- Check browser console for errors
- Ensure user has correct role permissions

## 📊 How Prompts Are Built

The AI service creates detailed prompts with context:

```typescript
// Example prompt for evaluation remarks
const prompt = `
Student: ${studentName}
Competency: ${competencyTitle}
Rating: ${rating}/5
Criteria: ${ratingCriteria}

Attendance Data:
- Total Hours: ${totalHours}
- On-Time Percentage: ${onTimePercentage}%
- Absences: ${absences}

Document History:
- Total Submitted: ${totalSubmitted}
- Approved: ${approved}
- Rejected: ${rejected}

Generate professional evaluation remarks that:
- Reflect the rating accurately
- Reference attendance and document performance
- Use professional academic language
- Be constructive and specific
`;
```

## 🎯 Best Practices

1. **Review Generated Content**: Always review and edit AI-generated text before saving
2. **Provide Context**: The more data (attendance, documents), the better the output
3. **Token Limits**: Set `AI_MAX_TOKENS=3000` or higher for reliable results
4. **Rate Limiting**: Don't spam the button - wait a few seconds between requests
5. **Error Handling**: If generation fails, try again or write manually

## 🔄 Complete Flow Diagram

```
User clicks "Generate with AI"
    ↓
Frontend: AIGenerateButton calls aiService
    ↓
Frontend: aiService.post('/api/ai/...')
    ↓
Backend: Route receives request (with auth token)
    ↓
Backend: Controller validates & fetches student data
    ↓
Backend: AI Service builds prompt with context
    ↓
Backend: Calls Gemini API (with API key)
    ↓
Gemini: Processes prompt & generates text
    ↓
Backend: Receives generated text
    ↓
Backend: Returns JSON { remarks: "..." }
    ↓
Frontend: Receives response
    ↓
Frontend: Calls onSuccess(generatedText)
    ↓
Frontend: Text appears in textarea (editable)
    ↓
User: Reviews & edits, then saves
```

## 🎓 Summary

The AI feature is a **smart assistant** that:
- ✅ Saves time writing evaluations and feedback
- ✅ Uses student data for context-aware responses
- ✅ Supports multiple AI providers (Gemini, OpenAI, Anthropic)
- ✅ Has rate limiting and security built-in
- ✅ Is cost-effective for typical usage
- ✅ Generates professional, academic-appropriate content

The generated content is **always editable** - it's a starting point, not a final answer!

