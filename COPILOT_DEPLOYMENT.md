# Strategy Copilot - GPT-5 Deployment Guide

## ✅ LIVE AI is Now Integrated!

The Strategy Copilot now uses **OpenAI GPT-5** to provide real, intelligent responses with data visualizations.

---

## How It Works

### Local Development
When you run `npm run dev`, the copilot will:
1. Check for `VITE_OPENAI_API_KEY` in `.env`
2. If found → Use GPT-5 LIVE mode ✅
3. If not found → Use smart template fallback mode

You'll see console logs:
- `✅ Strategy Copilot: GPT-5 LIVE mode enabled` (API key works)
- `⚠️ Strategy Copilot: Running in template mode (no API key)` (fallback)

### What GPT-5 Does
- Analyzes 47.3M customer records, 54 segments, risk distribution
- Answers ANY question about churn, segments, features, ROI
- Automatically generates charts when helpful
- Provides specific numbers with citations

---

## AWS Amplify Deployment

**CRITICAL:** You must set the environment variable in Amplify for GPT-5 to work.

### Step 1: Go to Amplify Console
https://console.aws.amazon.com/amplify/home

### Step 2: Select Your App
Find the app with domain: `d1p7obkrs6acpc.amplifyapp.com`

### Step 3: Add Environment Variable
1. Click **"App settings"** → **"Environment variables"**
2. Click **"Manage variables"**
3. Add:
   - **Variable**: `VITE_OPENAI_API_KEY`
   - **Value**: `<your-openai-api-key-here>`
4. Click **"Save"**

### Step 4: Redeploy
After adding the env var, trigger a new deployment:
- Option A: Push a new commit to main
- Option B: In Amplify Console → click "Redeploy this version"

The copilot will now use GPT-5 in production!

---

## Testing the Copilot

Once deployed, try these questions:

### Risk Analysis
- "Show me customer risk distribution"
- "Why is the Medium Risk segment so large?"
- "How many high-risk customers do we have?"

### Churn Drivers
- "What are the top churn drivers?"
- "Why do month-to-month customers churn?"
- "What features predict churn?"

### Segment Analysis
- "Tell me about early-tenure customers"
- "Compare M2M vs contract customers"
- "Which segment has the highest churn?"

### ROI Comparisons
- "Compare ROI across all strategies"
- "What's the optimal retention budget?"
- "Show me revenue impact of each scenario"

**GPT-5 will:**
- Analyze the actual customer data
- Generate relevant visualizations (donut charts, bar charts, etc.)
- Provide specific numbers and ROI projections
- Suggest related segments to explore

---

## Cost Considerations

**OpenAI Pricing (GPT-5):**
- Input: ~$0.005 per 1K tokens
- Output: ~$0.015 per 1K tokens
- **Average query cost: $0.01 - $0.03**

**Monthly estimates:**
- 100 queries/day: ~$50/month
- 500 queries/day: ~$250/month
- 1000 queries/day: ~$500/month

For demos, cost is negligible. For production, consider:
- Rate limiting (X queries per user per day)
- Caching common questions
- Usage monitoring

---

## Fallback Mode

If the API key is missing or quota exceeded:
- ✅ Copilot continues working with smart templates
- ✅ Still generates visualizations for common questions
- ✅ User experience is not broken
- ⚠️ Less flexible (can't answer arbitrary questions)

---

## Security Notes

**API Key Security:**
- ✅ `.env` is in `.gitignore` (not committed to repo)
- ✅ API key is client-side (acceptable for demo)
- ⚠️ For production, use backend API to protect key
- ⚠️ Set usage limits in OpenAI dashboard

**Production Best Practices:**
1. Create dedicated OpenAI project for this app
2. Set monthly spending limits ($100/month recommended)
3. Implement rate limiting (5 queries/min per user)
4. Monitor usage in OpenAI dashboard
5. Move API calls to backend (Next.js API routes, etc.)

---

## Troubleshooting

### "Running in template mode" in production
- Check Amplify environment variables are set correctly
- Ensure variable name is exactly: `VITE_OPENAI_API_KEY`
- Redeploy after adding env var

### API errors in console
- Check OpenAI account has credits
- Verify API key is valid
- Check for rate limit errors

### Slow responses
- GPT-5 typically responds in 1-3 seconds
- Check network connection
- Verify not hitting rate limits

---

## Summary

✅ **Local:** Works automatically with `.env` file
✅ **Production:** Set `VITE_OPENAI_API_KEY` in Amplify
✅ **Fallback:** Smart templates if API unavailable
✅ **Cost:** ~$0.02 per query (very affordable for demos)

The Strategy Copilot is now **REAL AI** - not window dressing! 🚀
