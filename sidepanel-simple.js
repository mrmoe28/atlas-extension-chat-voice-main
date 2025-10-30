// Simple working version with proper DOM handling
let connected = false;
let micStream = null;
let mediaRecorder = null;
let els = {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Atlas Voice Extension...');
  
  // Get all DOM elements
  els = {
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
    chatContainer: document.getElementById('chatContainer'),
    modalConnectBtn: document.getElementById('modalConnectBtn')
  };
  
  console.log('Found elements:', Object.keys(els).filter(k => els[k]).join(', '));
  
  // Set up event listeners
  setupEventListeners();
  
  // Load saved API key
  loadSavedApiKey();
});

function setupEventListeners() {
  // Hamburger menu - opens settings
  if (els.menuBtn) {
    els.menuBtn.addEventListener('click', () => {
      console.log('Menu button clicked');
      openSettings();
    });
  }
  
  // Settings button (if exists separately)
  if (els.settingsBtn) {
    els.settingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      openSettings();
    });
  }
  
  // Save settings button
  if (els.saveSettingsBtn) {
    els.saveSettingsBtn.addEventListener('click', saveApiKey);
  }
  
  // Connect buttons
  if (els.connectBtn) {
    els.connectBtn.addEventListener('click', handleConnect);
  }
  
  if (els.modalConnectBtn) {
    els.modalConnectBtn.addEventListener('click', () => {
      saveApiKey();
      setTimeout(handleConnect, 100); // Small delay to ensure save completes
    });
  }
  
  // Voice button
  if (els.voiceBtn) {
    els.voiceBtn.addEventListener('mousedown', startRecording);
    els.voiceBtn.addEventListener('mouseup', stopRecording);
    els.voiceBtn.addEventListener('mouseleave', stopRecording); // Stop if mouse leaves button
  }
  
  // Close modal handlers
  const closeButtons = [
    document.querySelector('.settings-close'),
    document.querySelector('#settingsBackdrop'),
    document.querySelector('.close-modal')
  ];
  
  closeButtons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', closeSettings);
    }
  });
}

function openSettings() {
  if (els.settingsModal) {
    els.settingsModal.classList.add('open');
    console.log('Settings modal opened');
  } else {
    console.error('Settings modal not found');
  }
}

function closeSettings() {
  if (els.settingsModal) {
    els.settingsModal.classList.remove('open');
    console.log('Settings modal closed');
  }
}

function loadSavedApiKey() {
  chrome.storage.local.get(['openaiApiKey'], (result) => {
    if (result.openaiApiKey && els.apiKeyInput) {
      els.apiKeyInput.value = result.openaiApiKey;
      console.log('API key loaded from storage');
    }
  });
}

function saveApiKey() {
  const apiKey = els.apiKeyInput?.value.trim();
  if (apiKey) {
    chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
      console.log('API key saved');
      alert('API key saved successfully!');
      closeSettings();
    });
  } else {
    alert('Please enter your OpenAI API key');
  }
}

function handleConnect() {
  if (connected) {
    disconnect();
  } else {
    connect();
  }
}

async function connect() {
  try {
    // Get API key
    let apiKey = els.apiKeyInput?.value.trim();
    
    if (!apiKey) {
      const stored = await chrome.storage.local.get(['openaiApiKey']);
      apiKey = stored.openaiApiKey;
    }
    
    if (!apiKey) {
      alert('Please enter your OpenAI API key in settings');
      openSettings();
      return;
    }
    
    console.log('Connecting with API key:', apiKey.substring(0, 20) + '...');
    
    // Update UI
    connected = true;
    els.orbStatus.textContent = 'Connected (Chat Mode)';
    els.connectBtn.textContent = 'Disconnect';
    els.voiceBtn.disabled = false;
    els.statusDot?.classList.add('connected');
    
    console.log('Connected successfully');
    
  } catch (error) {
    console.error('Connection error:', error);
    alert('Connection failed: ' + error.message);
    disconnect();
  }
}

function disconnect() {
  connected = false;
  
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  
  els.orbStatus.textContent = 'Disconnected';
  els.connectBtn.textContent = 'Connect';
  els.voiceBtn.disabled = true;
  els.statusDot?.classList.remove('connected');
  
  console.log('Disconnected');
}

async function startRecording() {
  if (!connected) {
    console.log('Not connected');
    return;
  }
  
  try {
    console.log('Starting recording...');
    
    // Get microphone access
    if (!micStream) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    
    // Create media recorder
    mediaRecorder = new MediaRecorder(micStream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing...');
      const blob = new Blob(chunks, { type: 'audio/webm' });
      await processAudio(blob);
    };
    
    mediaRecorder.start();
    els.voiceOrb?.classList.add('listening');
    els.orbStatus.textContent = 'Listening...';
    
  } catch (error) {
    console.error('Microphone error:', error);
    alert('Could not access microphone. Please check permissions.');
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    els.voiceOrb?.classList.remove('listening');
    els.orbStatus.textContent = 'Processing...';
  }
}

async function processAudio(audioBlob) {
  try {
    // Get API key
    let apiKey = els.apiKeyInput?.value.trim();
    if (!apiKey) {
      const stored = await chrome.storage.local.get(['openaiApiKey']);
      apiKey = stored.openaiApiKey;
    }
    
    console.log('Sending to Whisper API...');
    
    // Transcribe with Whisper
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
      const error = await whisperResponse.text();
      throw new Error('Whisper API error: ' + error);
    }
    
    const { text } = await whisperResponse.json();
    console.log('Transcribed:', text);
    
    // Show user message
    addMessage('user', text);
    
    // Get ChatGPT response
    console.log('Getting ChatGPT response...');
    
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: text }
        ]
      })
    });
    
    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      throw new Error('ChatGPT API error: ' + error);
    }
    
    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;
    
    // Show AI response
    addMessage('assistant', aiResponse);
    
    // Speak response
    const utterance = new SpeechSynthesisUtterance(aiResponse);
    window.speechSynthesis.speak(utterance);
    
    els.orbStatus.textContent = 'Connected (Chat Mode)';
    
  } catch (error) {
    console.error('Processing error:', error);
    els.orbStatus.textContent = 'Error: ' + error.message;
    alert('Error: ' + error.message);
  }
}

function addMessage(role, content) {
  if (!els.chatContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  
  els.chatContainer.appendChild(messageDiv);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
  
  // Show chat container if hidden
  if (els.chatContainer.style.display === 'none') {
    els.chatContainer.style.display = 'block';
    const orbWrapper = document.getElementById('voiceOrbWrapper');
    if (orbWrapper) {
      orbWrapper.style.display = 'none';
    }
  }
}

console.log('Atlas Voice Extension loaded');