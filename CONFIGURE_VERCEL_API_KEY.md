# Configure OpenAI API Key on Vercel

Your server is running but needs the OpenAI API key configured. Here's how to add it:

## Steps to Add API Key to Vercel

1. **Go to your Vercel Dashboard**
   - Visit: https://vercel.com/ekoapps/server
   - Or go to the deployment: https://vercel.com/ekoapps/server/CsShmHAxfnGppXn2EyLT3cg2eXoG

2. **Navigate to Settings → Environment Variables**
   - Click on your project
   - Go to "Settings" tab
   - Select "Environment Variables" from the left sidebar

3. **Add the OpenAI API Key**
   - Click "Add New"
   - Add these variables:
   
   ```
   Name: OPENAI_API_KEY
   Value: sk-[your-actual-api-key-here]
   Environment: Production, Preview, Development (select all)
   ```
   
   ```
   Name: OPENAI_REALTIME_MODEL  
   Value: gpt-4o-realtime-preview-2024-12-17
   Environment: Production, Preview, Development (select all)
   ```

4. **Redeploy the Project**
   - After adding environment variables, you need to redeploy
   - Go to the "Deployments" tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - Or trigger a new deployment by pushing to your repository

## Get Your OpenAI API Key

If you don't have an OpenAI API key:
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (it starts with `sk-`)
4. Save it securely (you won't be able to see it again)

## Verify It's Working

After redeploying with the API key:
1. Reload the Chrome extension
2. Click "Connect"
3. You should see "Ready - Hold button to talk" instead of an error

## Important Security Note

- Never commit API keys to GitHub
- Always use environment variables in Vercel
- Keep your API key secret and secure

## Alternative: Test with Local Server

If you want to test locally first:
1. Create `server/.env` file with your API key
2. Run `cd server && node server.js`
3. Change extension URL to `http://localhost:8787`
4. Test the connection