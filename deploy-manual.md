# Manual Edge Function Deployment Guide

Since automatic deployment requires additional setup, here's how to manually deploy the Edge Functions to your Supabase project:

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click on "Edge Functions" in the left sidebar
   - Click "Create a new function"

3. **Deploy generate-quiz function**
   - Function name: `generate-quiz`
   - Copy the entire content from `supabase/functions/generate-quiz/index.ts`
   - Paste it into the function editor
   - Click "Deploy function"

4. **Deploy analyze-quiz-performance function**
   - Click "Create a new function" again
   - Function name: `analyze-quiz-performance`
   - Copy the entire content from `supabase/functions/analyze-quiz-performance/index.ts`
   - Paste it into the function editor
   - Click "Deploy function"

## Method 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy generate-quiz
supabase functions deploy analyze-quiz-performance
```

## Method 3: Using Management API

You can also deploy using the Supabase Management API with curl:

```bash
# Get your access token from Supabase dashboard
# Replace YOUR_PROJECT_REF and YOUR_ACCESS_TOKEN

# Deploy generate-quiz
curl -X POST "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/functions/generate-quiz" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "generate-quiz",
    "source": "PASTE_FUNCTION_CODE_HERE",
    "verify_jwt": false
  }'

# Deploy analyze-quiz-performance
curl -X POST "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/functions/analyze-quiz-performance" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze-quiz-performance", 
    "source": "PASTE_FUNCTION_CODE_HERE",
    "verify_jwt": false
  }'
```

## Environment Variables Setup

After deploying the functions, you need to set environment variables in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to "Settings" → "Edge Functions"
3. Add these environment variables:

```
OPENAI_API_KEY=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
```

## Testing the Functions

After deployment, test the functions:

1. **Test generate-quiz:**
   ```bash
   curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-quiz" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "topic": "Indian History",
       "examType": "UPSC Civil Services",
       "difficulty": "intermediate",
       "questionCount": 5,
       "userId": "test-user-id"
     }'
   ```

2. **Check function logs in Supabase Dashboard** under Edge Functions → Logs

## Troubleshooting

- **Function not found**: Make sure the function is deployed and the name matches exactly
- **Environment variables**: Ensure OPENAI_API_KEY is set in Supabase Edge Functions settings
- **CORS errors**: The functions include CORS headers, but make sure your frontend URL is allowed
- **Timeout errors**: Edge functions have a 60-second timeout limit

## Next Steps

Once the functions are deployed:
1. Update your `.env` file with correct Supabase URL and keys
2. Test the quiz generation in your app
3. Monitor function logs for any errors
4. Set up proper error handling in your frontend