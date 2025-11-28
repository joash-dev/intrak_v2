# AI Integration Architecture

## Overview

The AI integration follows a **layered architecture** with clear separation between frontend, backend, and AI provider layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UI Components (React)                                │   │
│  │  - AIGenerateButton                                   │   │
│  │  - SupervisorEvaluation.tsx                           │   │
│  │  - InstructorDocuments.tsx                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend Service Layer                               │   │
│  │  - client/src/services/aiService.ts                  │   │
│  │  (Makes HTTP requests to backend)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP POST /api/ai/*
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes                                            │   │
│  │  - server/src/routes/ai.routes.ts                     │   │
│  │  (Authentication, Authorization, Rate Limiting)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers                                           │   │
│  │  - server/src/controllers/ai.controller.ts           │   │
│  │  (Fetches student data, prepares context)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Service                                           │   │
│  │  - server/src/services/aiService.ts                   │   │
│  │  (Generates prompts, calls AI provider)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Configuration                                        │   │
│  │  - server/src/config/ai.config.ts                     │   │
│  │  (Loads API keys, model settings from .env)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI PROVIDER LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   OpenAI     │  │  Anthropic   │  │   Gemini     │       │
│  │   API        │  │     API      │  │     API      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
intrak_v2/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── ai.config.ts          # AI configuration loader
│   │   ├── services/
│   │   │   └── aiService.ts           # Core AI service (OpenAI/Anthropic/Gemini)
│   │   ├── controllers/
│   │   │   └── ai.controller.ts       # API request handlers
│   │   ├── routes/
│   │   │   └── ai.routes.ts           # API routes with auth & rate limiting
│   │   └── index.ts                   # Registers AI routes
│   └── .env                           # API keys and configuration
│
└── client/
    └── src/
        ├── services/
        │   └── aiService.ts           # Frontend API client
        ├── components/
        │   └── ai/
        │       ├── AIGenerateButton.tsx    # Reusable AI button component
        │       ├── AILoadingState.tsx      # Loading indicator
        │       └── AIErrorState.tsx       # Error display
        └── pages/
            ├── SupervisorUi/
            │   └── SupervisorEvaluation.tsx    # Uses AI for remarks
            ├── InstructorUi/
            │   ├── InstructorDocuments.tsx     # Uses AI for feedback
            │   └── InstructorAttendanceVerification.tsx  # Uses AI for notes
            └── StudentUi/
                └── StudentWeeklyReport.tsx     # Uses AI for summaries
```

## Data Flow: Evaluation Remarks Generation

### Step-by-Step Flow

```
1. USER ACTION
   └─> Supervisor selects rating (1-5) for a competency
   └─> Clicks "Generate with AI" button

2. FRONTEND (SupervisorEvaluation.tsx)
   └─> AIGenerateButton.onClick()
   └─> Calls aiService.generateEvaluationRemarks({
         competencyId: "comp-123",
         rating: 4,
         studentId: "student-456",
         competencyTitle: "Work Attitude",
         ratingCriteria: "Accepts all work assignments..."
       })

3. FRONTEND SERVICE (client/src/services/aiService.ts)
   └─> Makes HTTP POST to /api/ai/evaluation-remarks
   └─> Sends: { competencyId, rating, studentId, ... }

4. BACKEND ROUTE (server/src/routes/ai.routes.ts)
   └─> authenticate middleware (checks JWT token)
   └─> aiRateLimiter (5 requests/minute)
   └─> authorize(['INDUSTRY_PARTNER']) (checks role)
   └─> Calls generateEvaluationRemarks controller

5. CONTROLLER (server/src/controllers/ai.controller.ts)
   └─> Validates required fields
   └─> Fetches student data from database:
       - Student name
       - Attendance logs (for metrics)
       - Documents (for submission history)
   └─> Calculates metrics:
       - Total hours worked
       - On-time percentage
       - Document approval rate
   └─> Calls aiService.generateEvaluationRemarks() with context

6. AI SERVICE (server/src/services/aiService.ts)
   └─> Builds contextual prompt:
       "Student: John Doe
        Rating: 4/5 for Work Attitude
        Criteria: Accepts all work assignments...
        Attendance: 200 hours, 95% on-time
        Documents: 10 submitted, 9 approved"
   └─> Calls AI provider API (Gemini/OpenAI/Anthropic)
   └─> Returns generated remarks

7. RESPONSE FLOW
   └─> Controller returns { remarks: "..." }
   └─> Route sends JSON response
   └─> Frontend service receives response
   └─> AIGenerateButton calls onSuccess(generatedText)
   └─> Text appears in textarea (editable)
```

## Key Components Explained

### 1. Configuration Layer (`ai.config.ts`)

**Purpose**: Centralized configuration management

```typescript
// Loads from .env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
AI_MODEL=gemini-2.5-flash
AI_ENABLED=true
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

**Features**:
- Supports multiple providers (OpenAI, Anthropic, Gemini)
- Environment-based configuration
- Default model recommendations per provider
- Feature flag (`AI_ENABLED`)

### 2. AI Service Layer (`aiService.ts`)

**Purpose**: Abstraction layer for AI providers

**Key Methods**:
- `generateEvaluationRemarks()` - Creates remarks from ratings
- `generateDocumentFeedback()` - Creates approval/rejection feedback
- `generateAttendanceNote()` - Creates verification notes
- `generateWeeklyReportSummary()` - Expands student notes
- `generateOverallComments()` - Synthesizes all competencies

**Provider Support**:
- `callOpenAI()` - OpenAI API integration
- `callAnthropic()` - Anthropic API integration
- `callGemini()` - Google Gemini API integration
- `generateText()` - Routes to correct provider

**Prompt Engineering**:
- Context-aware prompts with student data
- Professional tone instructions
- Structured output format

### 3. Controller Layer (`ai.controller.ts`)

**Purpose**: Business logic and data preparation

**Responsibilities**:
- Validates request data
- Fetches student data from database
- Calculates performance metrics
- Prepares context for AI
- Handles errors gracefully

**Example Context Building**:
```typescript
// Fetches student data
const student = await prisma.student.findUnique({
  where: { id: studentId },
  include: {
    user: { select: { name: true } },
    attendanceLogs: { ... },
    documents: { ... }
  }
});

// Calculates metrics
const totalHours = calculateTotalHours(student.attendanceLogs);
const onTimePercentage = calculateOnTimeRate(student.attendanceLogs);
const approvalRate = calculateDocumentApprovalRate(student.documents);

// Passes to AI service
await aiService.generateEvaluationRemarks({
  studentName: student.user.name,
  attendanceData: { totalHours, onTimePercentage },
  documentData: { ... },
  rating: 4,
  competencyTitle: "Work Attitude"
});
```

### 4. Route Layer (`ai.routes.ts`)

**Purpose**: API endpoint definition with security

**Security Features**:
- **Authentication**: `authenticate` middleware (JWT verification)
- **Authorization**: `authorize` middleware (role-based access)
- **Rate Limiting**: 5 requests per minute per user
- **Input Validation**: Controller validates required fields

**Endpoints**:
```
POST /api/ai/evaluation-remarks      [INDUSTRY_PARTNER]
POST /api/ai/document-feedback       [INSTRUCTOR, COORDINATOR]
POST /api/ai/attendance-note         [INDUSTRY_PARTNER, INSTRUCTOR]
POST /api/ai/weekly-report-summary   [STUDENT]
POST /api/ai/overall-comments        [INDUSTRY_PARTNER]
```

### 5. Frontend Service (`client/src/services/aiService.ts`)

**Purpose**: HTTP client for AI endpoints

**Features**:
- Type-safe interfaces
- Error handling
- Axios integration
- Promise-based API

**Usage**:
```typescript
import { aiService } from '../services/aiService';

const remarks = await aiService.generateEvaluationRemarks({
  competencyId: 'comp-123',
  rating: 4,
  studentId: 'student-456',
  competencyTitle: 'Work Attitude'
});
```

### 6. UI Component (`AIGenerateButton.tsx`)

**Purpose**: Reusable AI generation button

**Features**:
- Loading state with spinner
- Error display
- Disabled state when conditions not met
- Customizable size and variant
- Success callback

**Usage**:
```typescript
<AIGenerateButton
  onGenerate={async () => {
    return aiService.generateEvaluationRemarks({ ... });
  }}
  onSuccess={(text) => {
    setRemarks(text);
    toast.success('Remarks generated!');
  }}
  disabled={!rating || !selectedStudent}
  size="sm"
  variant="outline"
/>
```

## Integration Points

### 1. Supervisor Evaluation (`SupervisorEvaluation.tsx`)

**Location**: Next to each competency's remarks field

**Integration**:
```typescript
{state.rating > 0 && selectedIntern && (
  <AIGenerateButton
    onGenerate={async () => {
      const selectedCriteria = competency.criteria.find(
        (c) => c.rating === state.rating
      );
      return aiService.generateEvaluationRemarks({
        competencyId: competency.id,
        rating: state.rating,
        studentId: selectedIntern.id,
        competencyTitle: competency.title,
        ratingCriteria: selectedCriteria?.text || '',
      });
    }}
    onSuccess={(generatedText) => {
      setCompetencyRatings((prev) => ({
        ...prev,
        [competency.id]: {
          ...prev[competency.id],
          remarks: generatedText,
        },
      }));
    }}
    disabled={!state.rating || !selectedIntern}
  />
)}
```

### 2. Document Review (`InstructorDocuments.tsx`)

**Location**: In document approval/rejection modal

**Integration**:
```typescript
<AIGenerateButton
  onGenerate={async () => {
    return aiService.generateDocumentFeedback({
      documentId: document.id,
      action: 'approve', // or 'reject'
    });
  }}
  onSuccess={(feedback) => setFeedback(feedback)}
/>
```

### 3. Attendance Verification (`InstructorAttendanceVerification.tsx`)

**Location**: In attendance verification modal

**Integration**:
```typescript
<AIGenerateButton
  onGenerate={async () => {
    return aiService.generateAttendanceNote({
      attendanceLogId: log.id,
      action: 'approve',
    });
  }}
  onSuccess={(note) => setNote(note)}
/>
```

### 4. Weekly Reports (`StudentWeeklyReport.tsx`)

**Location**: Next to Knowledge/Skills field

**Integration**:
```typescript
<AIGenerateButton
  onGenerate={async () => {
    return aiService.generateWeeklyReportSummary({
      tasksAccomplished: tasks,
      knowledgeSkillsValues: skills,
    });
  }}
  onSuccess={(summary) => setSkills(summary)}
/>
```

## Security Measures

### 1. Authentication
- JWT token verification on all endpoints
- User must be logged in

### 2. Authorization
- Role-based access control
- Each endpoint restricted to specific roles
- Prevents unauthorized access

### 3. Rate Limiting
- 5 requests per minute per user
- Prevents abuse and cost overruns
- Configurable in route definition

### 4. Input Validation
- Required fields checked
- Type validation
- Student existence verification

### 5. Error Handling
- Graceful error messages
- No sensitive data in errors
- Detailed logging for debugging

## Environment Configuration

### Required Variables

```env
# Provider Selection
AI_PROVIDER=gemini                    # or 'openai' or 'anthropic'
AI_ENABLED=true                       # Feature flag

# API Keys (provider-specific)
GEMINI_API_KEY=your-gemini-key        # For Gemini
OPENAI_API_KEY=your-openai-key        # For OpenAI
ANTHROPIC_API_KEY=your-anthropic-key  # For Anthropic

# Model Configuration
AI_MODEL=gemini-2.5-flash             # Model name
AI_MAX_TOKENS=1000                    # Max response length
AI_TEMPERATURE=0.7                    # Creativity (0-1)
```

## Error Handling Strategy

### Frontend
- Try-catch blocks in async functions
- User-friendly error messages
- Error state display in UI
- Console logging for debugging

### Backend
- Validation at controller level
- Database error handling
- AI API error handling
- Detailed error logging
- Appropriate HTTP status codes

### Common Errors
- **400**: Missing required fields
- **401**: Not authenticated
- **403**: Insufficient permissions
- **404**: Student/document not found
- **429**: Rate limit exceeded
- **500**: Server/AI API error

## Testing

### Manual Testing
```bash
# Test AI service directly
cd server
npx ts-node scripts/test-ai-simple.ts

# Test with full context
npx ts-node scripts/test-ai.ts
```

### Integration Testing
- Test each endpoint with valid data
- Test with missing fields
- Test with invalid student IDs
- Test rate limiting
- Test role-based access

## Performance Considerations

### Caching
- No caching currently (AI responses are contextual)
- Could cache common prompts in future

### Optimization
- Parallel data fetching where possible
- Efficient database queries
- Minimal data sent to AI API

### Cost Management
- Rate limiting prevents abuse
- Token limits control costs
- Monitoring recommended for production

## Future Enhancements

1. **Caching**: Cache common AI responses
2. **Streaming**: Stream AI responses for better UX
3. **Analytics**: Track AI usage and costs
4. **A/B Testing**: Test different prompts
5. **Custom Models**: Fine-tune models for specific use cases
6. **Batch Processing**: Generate multiple remarks at once

## Summary

The AI integration is:
- ✅ **Modular**: Clear separation of concerns
- ✅ **Secure**: Authentication, authorization, rate limiting
- ✅ **Flexible**: Supports multiple AI providers
- ✅ **User-friendly**: Simple UI components
- ✅ **Maintainable**: Well-organized code structure
- ✅ **Scalable**: Easy to add new features

The architecture allows easy extension to new AI features while maintaining security and performance.

