# AI Troubleshooting Guide

## Common Errors and Solutions

### 1. "Failed to generate remarks"

**Possible Causes:**

#### A. Student Not Found
- **Symptom**: Error message mentions "Student not found"
- **Solution**: 
  - Verify the student exists in the database
  - Check that you've selected a student before generating remarks
  - Ensure the student ID is valid

#### B. Missing Required Fields
- **Symptom**: Error about missing fields
- **Solution**:
  - Make sure you've selected a rating (1-5) before clicking "Generate with AI"
  - Ensure a student is selected in the evaluation form
  - Check browser console for detailed error messages

#### C. API Configuration Issues
- **Symptom**: Generic "Failed to generate" error
- **Solution**:
  1. Check your `.env` file:
     ```env
     AI_PROVIDER=gemini
     GEMINI_API_KEY=your-key-here
     AI_MODEL=gemini-2.5-flash
     AI_ENABLED=true
     AI_MAX_TOKENS=1000
     ```
  2. Verify API key is correct
  3. Restart your server after changing `.env`

#### D. Token Limit Issues
- **Symptom**: Empty response or "MAX_TOKENS" error
- **Solution**:
  - Increase `AI_MAX_TOKENS=1000` (or higher) in `.env`
  - Restart server

#### E. Rate Limiting
- **Symptom**: "Too many requests" error
- **Solution**:
  - Wait 1 minute (system limits to 5 requests/minute)
  - This is normal behavior to prevent abuse

#### F. Permission Issues
- **Symptom**: "Forbidden: Insufficient permissions"
- **Solution**:
  - Verify you're logged in with the correct role:
    - Supervisors need `INDUSTRY_PARTNER` role
    - Instructors need `INSTRUCTOR` role
    - Coordinators need `COORDINATOR` role
  - Check server logs for role mismatch

### 2. Empty Response

**Causes:**
- Token limit too low (increase `AI_MAX_TOKENS`)
- API returned empty content
- Safety filters blocked content

**Solution:**
- Check server logs for finish reason
- Increase token limit
- Try regenerating

### 3. "AI service is not configured"

**Solution:**
- Set `AI_ENABLED=true` in `.env`
- Verify API key is set
- Restart server

### 4. Network/API Errors

**Solution:**
- Check internet connection
- Verify API key is valid
- Check API provider status
- Review server logs for detailed errors

## Debugging Steps

### Step 1: Check Server Logs
Look for these log messages:
- `📝 AI Request received:` - Request was received
- `✅ Student found:` - Student lookup successful
- `🤖 Calling AI service...` - AI call initiated
- `✅ AI remarks generated successfully` - Success
- `❌` messages indicate where it failed

### Step 2: Test API Directly
Run the test script:
```bash
cd server
npx ts-node scripts/test-ai-simple.ts
```

### Step 3: Check Browser Console
Open browser DevTools (F12) and check:
- Network tab for API request/response
- Console for error messages
- Look for detailed error information

### Step 4: Verify Configuration
```bash
# Check if .env is loaded
cd server
node -e "require('dotenv').config(); console.log('AI_ENABLED:', process.env.AI_ENABLED); console.log('AI_PROVIDER:', process.env.AI_PROVIDER);"
```

## Quick Fixes

### Fix 1: Update .env
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-actual-key
AI_MODEL=gemini-2.5-flash
AI_ENABLED=true
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

### Fix 2: Restart Server
After changing `.env`, always restart:
```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

### Fix 3: Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache

### Fix 4: Check Role Permissions
Verify your user role matches:
- Supervisors: `INDUSTRY_PARTNER`
- Instructors: `INSTRUCTOR`
- Coordinators: `COORDINATOR`
- Students: `STUDENT`

## Getting Help

If issues persist:

1. **Check Server Logs**: Look for error messages
2. **Check Browser Console**: Look for network errors
3. **Test API Directly**: Run `test-ai-simple.ts`
4. **Verify Configuration**: Check `.env` file
5. **Check API Key**: Verify it's valid and has permissions

## Error Message Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Failed to generate remarks" | Various | Check logs for details |
| "Student not found" | Invalid student ID | Select a valid student |
| "Missing required fields" | Rating/student not selected | Select rating and student |
| "Forbidden: Insufficient permissions" | Wrong role | Check user role |
| "Too many requests" | Rate limit | Wait 1 minute |
| "AI service is not configured" | Missing config | Check .env file |
| "MAX_TOKENS" | Token limit | Increase AI_MAX_TOKENS |

