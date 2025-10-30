# Server Setup Guide for Atlas Voice Extension

## Quick Start

The extension requires a local server to handle OpenAI API connections. Follow these steps:

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure OpenAI API Key

Create a `.env` file in the `server` directory:
```bash
cd server
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
```

**Important:** 
- Replace `sk-your-actual-api-key-here` with your actual OpenAI API key
- You can get an API key from: https://platform.openai.com/api-keys
- Never commit the `.env` file to git (it's already in .gitignore)

### 3. Start the Server
```bash
cd server
npm start
# Or if you don't have a start script:
node server.js
```

The server should start on `http://localhost:8787`

### 4. Configure Extension

1. Open the extension in Chrome
2. Click the settings icon
3. Make sure the Server URL is set to: `http://localhost:8787`
4. Click "Connect" to test the connection

## Troubleshooting

### "Failed to get ephemeral key" Error
- **Cause:** Server is not running or API key is not configured
- **Solution:** Follow steps 1-3 above

### "Cannot connect to server" Error  
- **Cause:** Server is not running or wrong URL
- **Solution:** 
  1. Check server is running: `ps aux | grep node`
  2. Verify URL in extension settings
  3. Check browser console for CORS errors

### "Server error: OpenAI API key may not be configured"
- **Cause:** Missing or invalid API key in `.env`
- **Solution:** 
  1. Check `.env` file exists in server directory
  2. Verify API key is correct and starts with `sk-`
  3. Restart server after changing `.env`

## Server Requirements

- Node.js 14+ 
- npm or yarn
- Valid OpenAI API key with Realtime API access
- Port 8787 available (or change in `.env`)

## Security Notes

- Keep your API key secret - never share or commit it
- The server should only run locally for development
- For production, use proper authentication and HTTPS