# Fix: Gemini Token Limit Issue

## Problem

Gemini 2.5 Flash uses "thinking tokens" that count towards the `maxOutputTokens` limit. When the limit is too low (e.g., 500), the model uses all tokens for thinking and has none left for the actual response.

## Solution

### Update .env File

**Required Change:**
```env
AI_MAX_TOKENS=2000
```

**Why 2000?**
- Gemini 2.5 Flash typically uses 500-1000 tokens for "thinking"
- We need additional tokens for the actual response (500-1000)
- Total: ~2000 tokens ensures we get output

### After Updating

1. **Restart your server** (required for .env changes to take effect)
2. **Test again** - The AI should now generate responses successfully

## Current Configuration

The code has been updated to:
- Default to 2000 tokens if not specified
- Provide better error messages showing thinking token usage
- Recommend appropriate token limits based on actual usage

## Verification

After updating, you should see:
- ✅ Successful AI generation
- ✅ No "MAX_TOKENS" errors
- ✅ Generated remarks appear in the textarea

## If Still Having Issues

If you still get token limit errors after setting `AI_MAX_TOKENS=2000`:

1. **Check your .env file** - Make sure the value is set correctly
2. **Restart server** - Environment variables are loaded at startup
3. **Try higher value** - Set `AI_MAX_TOKENS=3000` if needed
4. **Check server logs** - Look for the actual token usage numbers

## Cost Impact

- **2000 tokens**: ~$0.00015 per request (very affordable)
- **3000 tokens**: ~$0.000225 per request
- Still very cost-effective even with higher limits


