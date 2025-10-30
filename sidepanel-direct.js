// Direct OpenAI Connection Version - No Server Needed
let pc = null;
let dataChannel = null;
let micStream = null;
let remoteAudioEl = null;
let connected = false;
let isSpeaking = false;
let isListening = false;

// Get DOM elements
const els = {
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
      els.settingsModal.style.display = 'none';
    });
  }
});

// Connect directly to OpenAI
async function connectToOpenAI() {
  try {
    const apiKey = els.apiKeyInput.value.trim();
    if (!apiKey) {
      throw new Error('Please enter your OpenAI API key in settings');
    }

    els.orbStatus.textContent = 'Connecting to OpenAI...';
    
    // Get microphone access
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create peer connection
    pc = new RTCPeerConnection();
    
    // Add microphone tracks
    micStream.getTracks().forEach(track => {
      pc.addTrack(track, micStream);
    });
    
    // Setup data channel for text communication
    dataChannel = pc.createDataChannel('messages', {
      ordered: true,
      maxRetransmits: 10
    });
    
    dataChannel.onopen = () => {
      console.log('Data channel opened');
      connected = true;
      els.orbStatus.textContent = 'Connected to OpenAI';
      els.connectBtn.textContent = 'Disconnect';
      els.voiceBtn.disabled = false;
    };
    
    dataChannel.onmessage = (event) => {
      handleMessage(event.data);
    };
    
    // Create and handle remote audio
    pc.ontrack = (event) => {
      if (!remoteAudioEl) {
        remoteAudioEl = document.createElement('audio');
        remoteAudioEl.autoplay = true;
        remoteAudioEl.playsInline = true;
        document.body.appendChild(remoteAudioEl);
      }
      remoteAudioEl.srcObject = event.streams[0];
    };
    
    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // Connect to OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['text', 'audio'],
        instructions: 'You are a helpful AI assistant.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        sdp: offer.sdp
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }
    
    const data = await response.json();
    
    // Set remote description from OpenAI
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: data.sdp
    });
    
    console.log('Connected to OpenAI successfully');
    
  } catch (error) {
    console.error('Connection error:', error);
    els.orbStatus.textContent = `Error: ${error.message}`;
    disconnect();
  }
}

// Disconnect function
function disconnect() {
  if (dataChannel) dataChannel.close();
  if (pc) pc.close();
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
  }
  
  connected = false;
  pc = null;
  dataChannel = null;
  micStream = null;
  
  els.orbStatus.textContent = 'Disconnected';
  els.connectBtn.textContent = 'Connect';
  els.voiceBtn.disabled = true;
}

// Handle messages from OpenAI
function handleMessage(message) {
  try {
    const data = JSON.parse(message);
    
    if (data.type === 'response.audio_transcript.done') {
      addMessage('assistant', data.transcript);
    } else if (data.type === 'conversation.item.created') {
      if (data.item.role === 'user') {
        addMessage('user', data.item.content?.[0]?.transcript || '');
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
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
    document.getElementById('voiceOrbWrapper').style.display = 'none';
  }
  
  // Save to database (if needed)
  saveToDatabase({ role, content, timestamp: new Date() });
}

// Save conversation to database via Vercel
async function saveToDatabase(message) {
  try {
    await fetch('https://atlas-extension-chat-voice.vercel.app/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('Failed to save to database:', error);
  }
}

// Voice button handling
els.voiceBtn?.addEventListener('mousedown', () => {
  if (connected && dataChannel?.readyState === 'open') {
    isListening = true;
    els.voiceOrb.classList.add('listening');
    
    // Enable microphone
    if (micStream) {
      micStream.getTracks().forEach(track => track.enabled = true);
    }
    
    // Send start listening event
    dataChannel.send(JSON.stringify({
      type: 'input_audio_buffer.start'
    }));
  }
});

els.voiceBtn?.addEventListener('mouseup', () => {
  if (isListening) {
    isListening = false;
    els.voiceOrb.classList.remove('listening');
    
    // Disable microphone
    if (micStream) {
      micStream.getTracks().forEach(track => track.enabled = false);
    }
    
    // Send stop listening event
    if (dataChannel?.readyState === 'open') {
      dataChannel.send(JSON.stringify({
        type: 'input_audio_buffer.stop'
      }));
    }
  }
});

// Connect button
els.connectBtn?.addEventListener('click', () => {
  if (connected) {
    disconnect();
  } else {
    connectToOpenAI();
  }
});

// Settings button
els.settingsBtn?.addEventListener('click', () => {
  els.settingsModal.style.display = 'flex';
});

// Close settings modal
document.querySelector('.close-modal')?.addEventListener('click', () => {
  els.settingsModal.style.display = 'none';
});

console.log('Direct OpenAI connection ready - no server needed!');