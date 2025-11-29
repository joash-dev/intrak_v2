# AI Feature Setup for Render Deployment

## Problem
The AI feature is not displaying in your deployed site even though you added the `.env` file locally.

## Solution
**Render.com does NOT use `.env` files from your repository.** You must set environment variables directly in the Render Dashboard.

## Step-by-Step Instructions

### 1. Go to Render Dashboard
1. Navigate to: https://dashboard.render.com
2. Select your **Web Service** (the server, not the client)
3. Go to **Environment** tab

### 2. Add AI Environment Variables

Click **"Add Environment Variable"** and add each of these:

```env
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your-actual-gemini-api-key-here
AI_MODEL=gemini-2.5-flash
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**Important Notes:**
- Replace `your-actual-gemini-api-key-here` with your real Gemini API key
- Make sure `AI_ENABLED` is set to `true` (not `"true"` or `True`)
- The API key should NOT have quotes around it

### 3. Verify All Variables Are Set

After adding, you should see these in your Environment Variables list:
- ✅ `AI_ENABLED` = `true`
- ✅ `AI_PROVIDER` = `gemini`
- ✅ `GEMINI_API_KEY` = `your-key-here`
- ✅ `AI_MODEL` = `gemini-2.5-flash`
- ✅ `AI_MAX_TOKENS` = `2000`
- ✅ `AI_TEMPERATURE` = `0.7`

### 4. Redeploy Your Service

After adding the environment variables:
1. Go to **Manual Deploy** tab
2. Click **"Deploy latest commit"**
3. Wait for deployment to complete

**OR** just push a new commit to trigger automatic deployment:
```bash
git commit --allow-empty -m "Trigger redeploy for AI config"
git push
```

### 5. Verify AI is Working

After deployment:
1. Check Render logs for any errors
2. Log into your deployed application
3. Try using an AI feature (e.g., Generate with AI button)
4. Check browser console (F12) for any errors

## Troubleshooting

### AI Feature Still Not Showing?

1. **Check Render Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for errors related to AI configuration
   - Check if `AI_ENABLED` is being read correctly

2. **Verify Environment Variables:**
   - Make sure all variables are set (no typos)
   - Check that `AI_ENABLED` is exactly `true` (case-sensitive)
   - Verify API key is correct

3. **Test API Endpoint:**
   - After logging in, try accessing: `https://your-server.onrender.com/api/ai/config`
   - Should return JSON with `enabled: true` if configured correctly

4. **Check Browser Console:**
   - Open DevTools (F12) → Console tab
   - Look for any errors when AI buttons are clicked
   - Check Network tab for failed API requests

### Common Issues

**Issue:** `AI_ENABLED` is set but AI still doesn't work
- **Solution:** Make sure the API key is also set correctly
- **Solution:** Check that `AI_PROVIDER` matches your API key type (gemini/openai/anthropic)

**Issue:** Environment variables not being read
- **Solution:** Redeploy the service after adding variables
- **Solution:** Make sure you're editing the correct service (server, not client)

**Issue:** API key errors
- **Solution:** Verify your Gemini API key is valid
- **Solution:** Check API key has proper permissions
- **Solution:** Make sure there are no extra spaces or quotes in the key

## Getting Your Gemini API Key

If you don't have a Gemini API key yet:

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Select or create a Google Cloud project
4. Copy the generated key
5. Paste it into Render's `GEMINI_API_KEY` environment variable

## Quick Checklist

- [ ] All 6 AI environment variables added to Render Dashboard
- [ ] `AI_ENABLED` set to `true` (not `"true"`)
- [ ] `GEMINI_API_KEY` contains your actual API key
- [ ] Service redeployed after adding variables
- [ ] Checked Render logs for errors
- [ ] Tested AI feature in deployed application

## Need Help?

If AI still doesn't work after following these steps:
1. Check Render logs for specific error messages
2. Verify your API key works by testing it directly
3. Make sure your service is using the latest code with AI features

