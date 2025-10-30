# Simplified Setup - Direct OpenAI Connection

## Overview
The extension now connects directly to OpenAI without needing a proxy server. Vercel is only used for saving conversation history to a database.

## Setup Steps

### 1. Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Install the Extension
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `atlas-extension-chat-voice-main` folder

### 3. Configure the Extension
1. Click the extension icon in Chrome
2. Click the settings gear icon
3. Paste your OpenAI API key
4. Click Save

### 4. Use the Extension
1. Click "Connect" to connect directly to OpenAI
2. Hold the voice button to speak
3. Release to send your message
4. The AI will respond via voice

## Vercel Setup (Optional - For Conversation History)

### Database Setup
1. Go to your Vercel project: https://vercel.com/ekoapps/atlas-extension-chat-voice
2. Add PostgreSQL database (Vercel Postgres or Neon)
3. The database will automatically save conversation history

### Environment Variables Needed
- `POSTGRES_URL` - Your database connection string
- That's it! No OpenAI key needed on Vercel

## Benefits of This Approach

1. **More Secure** - API key stays in your browser, never sent to a server
2. **Faster** - Direct connection to OpenAI, no proxy overhead
3. **Simpler** - No server to maintain or debug
4. **Cheaper** - Only pay for Vercel database, not compute

## Troubleshooting

### "Invalid API Key" Error
- Check your API key starts with `sk-`
- Make sure you have credits on your OpenAI account
- Verify the key has Realtime API access

### Cannot Connect
- Check browser console for errors
- Ensure microphone permissions are granted
- Try refreshing the extension

## What Vercel Projects to Delete

You can safely delete these Vercel projects:
- `server` (server-eight-xi-83)
- `atlas-voice-web`

Keep only:
- `atlas-extension-chat-voice` (for database only)