# Architecture Redesign

## New Simplified Architecture

### 1. Chrome Extension (Direct OpenAI Connection)
- Connects directly to OpenAI Realtime API
- No server proxy needed for API calls
- Stores API key securely in extension storage

### 2. Vercel Database API (Single Endpoint)
- Only used for saving/retrieving conversation history
- PostgreSQL database for persistent storage
- Simple REST API for CRUD operations

### 3. Projects to Keep/Remove

**KEEP:**
- `atlas-extension-chat-voice` - Main database API

**REMOVE:**
- `server` project
- `atlas-voice-web` project
- All server proxy code

## Implementation Plan

1. Modify extension to use OpenAI API directly
2. Create simple database API on Vercel
3. Remove server dependency
4. Clean up unnecessary code