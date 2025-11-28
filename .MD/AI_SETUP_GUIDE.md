# AI Integration Setup Guide

This guide will help you set up AI capabilities for the INTRAK OJT Management System.

## Quick Start

### Step 1: Choose Your AI Provider

You can use **OpenAI**, **Anthropic** (Claude), or **Google Gemini**. 
- **OpenAI GPT-3.5-turbo**: Best balance of cost, speed, and quality (Recommended)
- **Google Gemini Fast**: Very fast and cost-effective alternative
- **Anthropic Claude**: Excellent quality, slightly more expensive

### Step 2: Get Your API Key

#### For OpenAI:
1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-...`)
5. **Important**: Save it immediately - you won't see it again!

#### For Anthropic:
1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **"Create Key"**
5. Copy the key (starts with `sk-ant-...`)

#### For Google Gemini:
1. Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select or create a Google Cloud project
5. Copy the API key (long alphanumeric string)

### Step 3: Configure Environment Variables

1. Navigate to the `server` directory
2. Create a `.env` file (if it doesn't exist)
3. Add the following configuration:

```env
# Choose your provider: 'openai', 'anthropic', or 'gemini'
AI_PROVIDER=gemini

# Add your API key (only for the provider you chose)
OPENAI_API_KEY=sk-your-actual-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
# OR
GEMINI_API_KEY=your-gemini-api-key-here

# Model selection (see recommendations below)
AI_MODEL=gemini-1.5-flash

# Enable AI features
AI_ENABLED=true

# Generation settings
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.7
```

### Step 4: Model Recommendations

#### OpenAI Models:
- **gpt-3.5-turbo** (Recommended) - Fast, cost-effective, good quality
- **gpt-4** - Higher quality, more expensive, slower
- **gpt-4-turbo** - Best quality, most expensive

#### Anthropic Models:
- **claude-3-haiku-20240307** (Recommended) - Fast, cost-effective
- **claude-3-sonnet-20240229** - Balanced quality and speed
- **claude-3-opus-20240229** - Best quality, most expensive

#### Google Gemini Models:
- **gemini-1.5-flash** (Recommended) - Very fast, cost-effective, great quality
- **gemini-1.5-pro** - Higher quality, slightly slower
- **gemini-pro** - Legacy model (still available)

### Step 5: Verify Setup

1. Restart your server
2. Try using an AI feature (e.g., generate evaluation remarks)
3. Check server logs for any errors

## Cost Considerations

### OpenAI Pricing (as of 2024):
- **gpt-3.5-turbo**: ~$0.0015 per 1K tokens (input), ~$0.002 per 1K tokens (output)
- **gpt-4**: ~$0.03 per 1K tokens (input), ~$0.06 per 1K tokens (output)

### Anthropic Pricing (as of 2024):
- **claude-3-haiku**: ~$0.25 per 1M tokens (input), ~$1.25 per 1M tokens (output)
- **claude-3-sonnet**: ~$3 per 1M tokens (input), ~$15 per 1M tokens (output)

**Tip**: Start with `gpt-3.5-turbo` or `claude-3-haiku` for cost-effective testing.

## Security Best Practices

1. **Never commit `.env` files to git** - They're already in `.gitignore`
2. **Use environment variables** in production (not hardcoded keys)
3. **Rotate API keys** periodically
4. **Monitor usage** through your provider's dashboard
5. **Set usage limits** in your provider account to prevent unexpected charges

## Troubleshooting

### "AI service is not configured or enabled"
- Check that `AI_ENABLED=true` in your `.env` file
- Verify your API key is correct
- Ensure the key has proper permissions

### "Failed to generate content"
- Check your API key balance/credits
- Verify internet connection
- Check server logs for detailed error messages
- Ensure rate limits aren't exceeded (5 requests/minute per user)

### Rate Limiting
- The system limits AI requests to 5 per minute per user
- Wait a minute and try again if you hit the limit

## Testing Without API Keys

If you want to test the system without setting up AI:
- Set `AI_ENABLED=false` in your `.env` file
- The AI buttons will still appear but will show an error when clicked
- This allows you to test the UI without incurring API costs

## Support

For issues with:
- **API Keys**: Contact your AI provider's support
- **Integration Issues**: Check server logs and error messages
- **Cost Questions**: Review your provider's pricing documentation

