# Google Gemini Fast Setup Guide

## Why Gemini Fast?

**Gemini 1.5 Flash** is Google's fast and cost-effective AI model, perfect for your OJT system:

- ✅ **Very Fast**: Typically < 1 second response time
- ✅ **Cost-Effective**: Free tier available, then $0.075 per 1M input tokens
- ✅ **High Quality**: Excellent for professional writing
- ✅ **Easy Setup**: Simple API key from Google AI Studio
- ✅ **Good for All Use Cases**: Evaluation remarks, document feedback, attendance notes, weekly reports

## Quick Setup

### Step 1: Get Your API Key

1. Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select or create a Google Cloud project (you can use the default)
5. Copy your API key (it's a long alphanumeric string)

**Note**: Google provides a free tier with generous limits for testing!

### Step 2: Configure Your Environment

Add to your `server/.env` file:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key-here
AI_MODEL=gemini-1.5-flash
AI_ENABLED=true
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.7
```

### Step 3: Restart Your Server

Restart your server to load the new configuration.

## Cost Comparison

### Gemini 1.5 Flash Pricing:
- **Input**: $0.075 per 1M tokens (~$0.000075 per 1K tokens)
- **Output**: $0.30 per 1M tokens (~$0.0003 per 1K tokens)
- **Free Tier**: 15 requests per minute (generous for most use cases)

### Cost Examples:
- 100 evaluation remarks: ~$0.04 (very cheap!)
- 500 document feedbacks: ~$0.20
- 1,000 attendance notes: ~$0.08

**Comparison with other providers:**
- Gemini Flash: ~$0.04 per 100 requests
- GPT-3.5-turbo: ~$0.10 per 100 requests
- Claude Haiku: ~$0.06 per 100 requests

## Model Options

### Recommended: `gemini-1.5-flash`
- Fastest response time
- Best cost-to-quality ratio
- Perfect for all OJT use cases
- Free tier available

### Alternative: `gemini-1.5-pro`
- Higher quality output
- Better for complex evaluations
- Slightly slower and more expensive
- Use if you need premium quality

## Advantages of Gemini

1. **Free Tier**: Google offers generous free usage for testing
2. **Speed**: Fastest response times among all providers
3. **Cost**: Very competitive pricing, especially at scale
4. **Quality**: Excellent for professional/academic writing
5. **Integration**: Easy to set up with Google account

## Use Cases

Gemini Fast works excellently for:

- ✅ **Evaluation Remarks**: Fast, professional, contextual
- ✅ **Document Feedback**: Clear, constructive, actionable
- ✅ **Attendance Notes**: Brief, professional verification notes
- ✅ **Weekly Reports**: Professional academic summaries

## Troubleshooting

### "API key not valid"
- Verify your API key is correct
- Check that you've enabled the Gemini API in Google Cloud Console
- Ensure you're using the correct model name

### "Quota exceeded"
- Check your free tier limits (15 requests/minute)
- Upgrade to paid tier if needed
- Consider rate limiting adjustments

### "Model not found"
- Use `gemini-1.5-flash` (recommended)
- Or `gemini-1.5-pro` for higher quality
- Check Google's latest model names

## Migration from Other Providers

If you're currently using OpenAI or Anthropic:

1. Get your Gemini API key
2. Update `.env` file:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-key
   AI_MODEL=gemini-1.5-flash
   ```
3. Restart server
4. Test - no code changes needed!

## Best Practices

1. **Start with Free Tier**: Test thoroughly before upgrading
2. **Monitor Usage**: Check Google Cloud Console for usage stats
3. **Set Budget Alerts**: Configure spending limits in Google Cloud
4. **Use Flash for Most Cases**: Only use Pro for critical evaluations

## Support

- **API Documentation**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Pricing**: [https://ai.google.dev/pricing](https://ai.google.dev/pricing)
- **Google AI Studio**: [https://aistudio.google.com](https://aistudio.google.com)

