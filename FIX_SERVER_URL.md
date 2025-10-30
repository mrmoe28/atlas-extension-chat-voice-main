# Fix Server URL Issue

The extension is showing the old server URL. To fix this:

## Option 1: Clear Extension Data (Quickest)

1. Open Chrome DevTools in the extension (right-click on extension → Inspect)
2. Go to the Console tab
3. Run this command to clear old settings:
```javascript
localStorage.clear();
localStorage.setItem('atlasVoice_serverUrl', 'https://server-flame-iota.vercel.app');
location.reload();
```

## Option 2: Manual Update

1. Click the Settings icon (gear) in the extension
2. Change the Server URL field from:
   - OLD: `https://atlas-extension-chat-voice.vercel.app`
   - NEW: `https://server-flame-iota.vercel.app`
3. Click Save Settings
4. Try connecting again

## Option 3: Reload Extension

1. Go to `chrome://extensions`
2. Find "Atlas Voice Panel"
3. Click the refresh icon
4. Open the extension again
5. The server URL should now be: `https://server-flame-iota.vercel.app`

## Verify It's Working

After updating, when you click Connect:
- You should NOT see "Server endpoint not found"
- Instead, you might see "OpenAI API key may not be configured" (this means the server is responding)

## Note
The server URL in the error message (`https://atlas-extension-chat-voice.vercel.app`) was the old default. The extension has been updated to use `https://server-flame-iota.vercel.app` as the new default.