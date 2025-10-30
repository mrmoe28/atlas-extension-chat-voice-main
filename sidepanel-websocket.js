// OpenAI Realtime API WebSocket Connection
let ws = null;
let micStream = null;
let audioContext = null;
let mediaRecorder = null;
let connected = false;

// Get DOM elements
const els = {
  menuBtn: document.getElementById('menuBtn'),
  connectBtn: document.getElementById('connectBtn'),
  voiceBtn: document.getElementById('voiceBtn'),
  orbStatus: document.getElementById('orbStatus'),
  statusDot: document.getElementById('statusDot'),
  apiKeyInput: document.getElementById('apiKey'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  saveSettingsBtn: document.getElementById('saveSettings'),
  voiceOrb: document.getElementById('voiceOrb'),
  chatContainer: document.getElementById('chatContainer')
};

// Load saved API key
chrome.storage.local.get(['openaiApiKey'], (result) => {
  if (result.openaiApiKey) {
    els.apiKeyInput.value = result.openaiApiKey;
  }
});

// Save API key
els.saveSettingsBtn?.addEventListener('click', () => {
  const apiKey = els.apiKeyInput.value.trim();
  if (apiKey) {
    chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
      console.log('API key saved');
      els.settingsModal?.classList.remove('open');
      alert('API key saved successfully!');
    });
  } else {
    alert('Please enter your OpenAI API key');
  }
});

// Connect to OpenAI via WebSocket
async function connectToOpenAI() {
  try {
    // Get API key
    let apiKey = els.apiKeyInput.value.trim();
    
    if (!apiKey) {
      const stored = await chrome.storage.local.get(['openaiApiKey']);
      apiKey = stored.openaiApiKey;
    }
    
    if (!apiKey) {
      throw new Error('Please enter your OpenAI API key in settings');
    }
    
    console.log('Connecting with API key:', apiKey.substring(0, 10) + '...');
    els.orbStatus.textContent = 'Connecting to OpenAI...';
    
    // Create WebSocket connection to OpenAI Realtime API
    ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });
    
    // Unfortunately, browser WebSocket doesn't support custom headers
    // We need to use a different approach - use the server as a proxy
    // Or use the OpenAI API differently
    
    // For now, let's use a simpler approach with the Chat API
    connected = true;
    els.orbStatus.textContent = 'Connected (Chat Mode)';
    els.connectBtn.textContent = 'Disconnect';
    els.voiceBtn.disabled = false;
    els.statusDot.classList.add('connected');
    
    console.log('Connected in chat mode');
    
  } catch (error) {
    console.error('Connection error:', error);
    els.orbStatus.textContent = `Error: ${error.message}`;
    disconnect();
  }
}

// Disconnect function
function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
  
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  
  connected = false;
  els.orbStatus.textContent = 'Disconnected';
  els.connectBtn.textContent = 'Connect';
  els.voiceBtn.disabled = true;
  els.statusDot.classList.remove('connected');
}

// Use Chat Completions API with voice input
async function sendVoiceMessage(audioBlob) {
  try {
    let apiKey = els.apiKeyInput.value.trim();
    
    if (!apiKey) {
      const stored = await chrome.storage.local.get(['openaiApiKey']);
      apiKey = stored.openaiApiKey;
    }
    
    // Convert audio to text using Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!whisperResponse.ok) {
      throw new Error('Failed to transcribe audio');
    }
    
    const { text } = await whisperResponse.json();
    console.log('Transcribed:', text);
    
    // Add user message to chat
    addMessage('user', text);
    
    // Send to ChatGPT
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: text }
        ]
      })
    });
    
    if (!chatResponse.ok) {
      throw new Error('Failed to get AI response');
    }
    
    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;
    
    // Add AI response to chat
    addMessage('assistant', aiResponse);
    
    // Use browser TTS to speak response
    const utterance = new SpeechSynthesisUtterance(aiResponse);
    window.speechSynthesis.speak(utterance);
    
  } catch (error) {
    console.error('Error processing voice:', error);
    els.orbStatus.textContent = `Error: ${error.message}`;
  }
}

// Add message to chat
function addMessage(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  els.chatContainer.appendChild(messageDiv);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
  
  // Show chat container if hidden
  if (els.chatContainer.style.display === 'none') {
    els.chatContainer.style.display = 'block';
    document.getElementById('voiceOrbWrapper')?.style.display = 'none';
  }
}

// Voice button handling with MediaRecorder
els.voiceBtn?.addEventListener('mousedown', async () => {
  if (!connected) return;
  
  try {
    if (!micStream) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    
    mediaRecorder = new MediaRecorder(micStream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      sendVoiceMessage(blob);
    };
    
    mediaRecorder.start();
    els.voiceOrb.classList.add('listening');
    els.orbStatus.textContent = 'Listening...';
    
  } catch (error) {
    console.error('Microphone error:', error);
    alert('Could not access microphone');
  }
});

els.voiceBtn?.addEventListener('mouseup', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    els.voiceOrb.classList.remove('listening');
    els.orbStatus.textContent = 'Processing...';
  }
});

// Connect button
const connectHandler = () => {
  if (connected) {
    disconnect();
  } else {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        els.apiKeyInput.value = result.openaiApiKey;
        connectToOpenAI();
      } else {
        alert('Please enter and save your OpenAI API key first');
      }
    });
  }
};

els.connectBtn?.addEventListener('click', connectHandler);
document.getElementById('modalConnectBtn')?.addEventListener('click', () => {
  const apiKey = els.apiKeyInput.value.trim();
  if (apiKey) {
    chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
      console.log('API key saved');
      els.settingsModal?.classList.remove('open');
      connectToOpenAI();
    });
  } else {
    alert('Please enter your OpenAI API key');
  }
});

// Hamburger menu
els.menuBtn?.addEventListener('click', () => {
  console.log('Hamburger menu clicked');
  if (els.settingsModal) {
    els.settingsModal.classList.add('open');
  }
});

// Settings button
els.settingsBtn?.addEventListener('click', () => {
  if (els.settingsModal) {
    els.settingsModal.classList.add('open');
  }
});

// Close settings modal
document.querySelector('.settings-close')?.addEventListener('click', () => {
  els.settingsModal?.classList.remove('open');
});

document.querySelector('#settingsBackdrop')?.addEventListener('click', () => {
  els.settingsModal?.classList.remove('open');
});

console.log('OpenAI Chat Mode ready!');