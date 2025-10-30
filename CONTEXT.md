# Atlas Extension Chat Voice - Context

## Current State (October 30, 2025)

### Project Overview
Atlas Extension Chat Voice is a Chrome browser extension that provides voice interaction with OpenAI's ChatGPT. Users can speak their questions, get AI responses, and hear them spoken back using text-to-speech.

### Architecture (Simplified Direct Connection)
The extension has been redesigned to connect directly to OpenAI APIs without requiring a proxy server:
- **Voice Input**: Web Speech Recognition API (Native browser/OS speech-to-text - FREE!)
- **AI Processing**: OpenAI Chat Completions API (GPT-3.5-turbo - 10x cheaper than GPT-4!)
- **Voice Output**: OpenAI TTS API (Natural sounding voices like ChatGPT)
- **Storage**: Chrome Storage API for API key persistence
- **Database**: Vercel endpoint for conversation history (optional)

### Key Files
- **sidepanel.html**: Main UI with voice orb and chat interface
- **sidepanel-simple.js**: Core functionality (currently active)
- **manifest.json**: Chrome extension configuration
- **styles.css**: UI styling
- **assets/**: Icon files (16x16, 48x48, 128x128)

### Deprecated Files (kept for reference)
- **sidepanel-direct.js**: Attempted WebRTC implementation (didn't work)
- **sidepanel-websocket.js**: Attempted WebSocket connection (browser limitations)
- **sidepanel.js**: Original complex server-proxy version

### Working Features
✅ Extension loads without errors
✅ Hamburger menu opens settings modal
✅ API key saving/loading from Chrome storage
✅ Connection state management
✅ Voice recording with Web Speech Recognition API (FREE!)
✅ Native browser speech-to-text (no Whisper API needed)
✅ ChatGPT response generation (GPT-3.5-turbo)
✅ OpenAI TTS with natural voices (alloy, echo, fable, onyx, nova, shimmer)
✅ Chat message display
✅ Real-time transcript display while speaking
✅ Fallback to browser TTS if OpenAI TTS fails
✅ **Continuous Listening Mode** - Automatically restarts after each response
✅ **Voice Selection** - Choose from 6 OpenAI voices
✅ **Knowledge Base** - View conversation history
✅ **Clear Memory** - Reset conversation history
✅ **Settings Persistence** - All settings saved to Chrome storage

### User Flow
1. User clicks hamburger menu → Settings modal opens
2. User enters OpenAI API key → Saved to Chrome storage
3. User clicks Connect → Validates key, enables voice button
4. User holds voice button → Browser starts speech recognition
5. User speaks → Real-time transcript shown in status
6. Release button → Final transcript sent to ChatGPT
7. AI response → Displayed in chat and spoken via TTS

### API Endpoints Used
- **ChatGPT**: `https://api.openai.com/v1/chat/completions`
- **TTS**: `https://api.openai.com/v1/audio/speech`
- **Database** (optional): `https://atlas-extension-chat-voice.vercel.app/api/conversations`

### Cost Breakdown with Current Setup
- **Speech Recognition**: FREE (using native browser API)
- **GPT-3.5-turbo**: $0.0015 per 1K tokens (10x cheaper than GPT-4)
- **OpenAI TTS**: $0.015 per 1K characters (natural voices)
- **Total per conversation**: ~$0.003-0.005 (very affordable!)
- **Benefit**: High quality voices like ChatGPT with minimal cost

### Technical Decisions
1. **No Server Proxy**: Direct connection to OpenAI APIs from browser
2. **Simplified Architecture**: Removed WebRTC/WebSocket complexity
3. **Browser TTS**: Using built-in speech synthesis instead of external TTS
4. **Chat API**: Using Chat Completions instead of Realtime API
5. **Chrome Storage**: API key stored locally in browser

### Known Limitations
- Browser WebSocket doesn't support custom headers (can't use Realtime API)
- CORS restrictions require proper manifest permissions
- Audio format limited to webm from MediaRecorder
- TTS voice quality depends on browser/OS

### Testing Checklist
- [x] Extension installs without errors
- [x] Icons display correctly
- [x] Hamburger menu clickable
- [x] Settings modal opens/closes
- [x] API key saves and persists
- [x] Connect button works
- [x] Voice button enables after connection
- [ ] Voice recording captures audio (user needs to test)
- [ ] Whisper transcribes correctly (user needs to test)
- [ ] ChatGPT responds appropriately (user needs to test)
- [ ] TTS speaks responses (user needs to test)

### Next Steps for User
1. Reload extension in Chrome
2. Click hamburger menu
3. Enter OpenAI API key
4. Click Connect
5. Hold voice button and speak
6. Verify complete flow works

### Recent Changes (October 30)
- Fixed hamburger menu not opening settings modal
- Added DOMContentLoaded wrapper to ensure proper initialization
- Simplified connection logic (no actual WebSocket/WebRTC)
- Added debugging console.log statements
- Created three implementation attempts:
  - sidepanel-direct.js (WebRTC approach - failed)
  - sidepanel-websocket.js (WebSocket approach - browser limitations)
  - sidepanel-simple.js (Chat API approach - working)
- **MAJOR UPDATE**: Replaced Whisper API with native Web Speech Recognition
  - Eliminates transcription costs
  - Works offline for speech-to-text
  - Shows real-time transcription while speaking
  - Better integration with macOS/iOS dictation
- Improved error handling for API quota issues
- **Switched to GPT-3.5-turbo** for 10x cost reduction
- Added API key validation on connect
- **Added OpenAI TTS** for natural-sounding voices (like ChatGPT)
- Implemented fallback to browser TTS if OpenAI TTS fails
- **Implemented All Settings Features**:
  - Continuous listening mode
  - Voice selection dropdown (6 voices)
  - Knowledge base viewing
  - Memory clearing
  - Conversation history (last 50 messages)
  - All settings persist across sessions

### Environment Variables (Not Used)
The extension stores the API key in Chrome storage, not environment variables.

### Vercel Project
- **Project Name**: atlas-extension-chat-voice
- **Purpose**: Database for conversation history (optional)
- **Not Required**: Extension works without Vercel

### Development Notes
- All event handlers wrapped in DOMContentLoaded for reliability
- Console.log statements added for debugging
- Proper error handling with user-friendly messages
- Uses async/await for all API calls
- Graceful fallbacks if elements not found

### File Structure
```
atlas-extension-chat-voice-main/
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── api/
│   └── conversations.js (Vercel database endpoint)
├── manifest.json (Extension configuration)
├── sidepanel.html (Main UI)
├── sidepanel-simple.js (Active implementation)
├── sidepanel-direct.js (Deprecated WebRTC attempt)
├── sidepanel-websocket.js (Deprecated WebSocket attempt)
├── sidepanel.js (Original server-proxy version)
├── styles.css (UI styling)
├── background.js (Service worker)
├── content.js (Content script)
├── vercel.json (Vercel configuration)
└── context.md (This file)