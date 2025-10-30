// Simple working version with proper DOM handling
let connected = false;
let recognition = null;
let els = {};
let continuousMode = false;
let selectedVoice = 'alloy';
let conversationHistory = [];
let isProcessing = false;  // Prevent multiple simultaneous API calls
let shouldRestartRecognition = false;  // Control when to restart in continuous mode

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
    modalConnectBtn: document.getElementById('modalConnectBtn'),
    // Text input elements
    textInput: document.getElementById('textInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceStatus: document.getElementById('voiceStatus'),
    // Additional settings elements
    continuousModeCheckbox: document.getElementById('continuousMode'),
    voiceSelect: document.getElementById('voiceSelect'),
    viewKnowledgeBtn: document.getElementById('viewKnowledgeBtn'),
    clearMemoryBtn: document.getElementById('clearMemoryBtn'),
    browserViewMode: document.getElementById('browserViewMode'),
    desktopMode: document.getElementById('desktopMode'),
    memoryEnabled: document.getElementById('memoryEnabled'),
    visionMode: document.getElementById('visionMode')
  };
  
  console.log('Found elements:', Object.keys(els).filter(k => els[k]).join(', '));
  
  // Set up event listeners
  setupEventListeners();
  
  // Load saved API key
  loadSavedApiKey();
  
  // Initialize voice dropdown
  initializeVoiceDropdown();
  
  // Load saved settings
  loadAllSettings();
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
  
  // Settings checkboxes
  if (els.continuousModeCheckbox) {
    els.continuousModeCheckbox.addEventListener('change', (e) => {
      continuousMode = e.target.checked;
      chrome.storage.local.set({ continuousMode });
      console.log('Continuous mode:', continuousMode);
    });
  }
  
  // Voice selection
  if (els.voiceSelect) {
    els.voiceSelect.addEventListener('change', (e) => {
      selectedVoice = e.target.value;
      chrome.storage.local.set({ selectedVoice });
      console.log('Selected voice:', selectedVoice);
    });
  }
  
  // Knowledge base buttons
  if (els.viewKnowledgeBtn) {
    els.viewKnowledgeBtn.addEventListener('click', viewKnowledgeBase);
  }
  
  if (els.clearMemoryBtn) {
    els.clearMemoryBtn.addEventListener('click', clearMemory);
  }
  
  // Other settings
  if (els.memoryEnabled) {
    els.memoryEnabled.addEventListener('change', (e) => {
      chrome.storage.local.set({ memoryEnabled: e.target.checked });
    });
  }
  
  // Text input functionality
  if (els.textInput) {
    els.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendTextMessage();
      }
    });
  }
  
  if (els.sendBtn) {
    els.sendBtn.addEventListener('click', sendTextMessage);
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
    
    console.log('Testing API key:', apiKey.substring(0, 10) + '...');
    els.orbStatus.textContent = 'Testing API key...';
    
    // Test the API key with a minimal request
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5 // Minimal tokens to test
      })
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      let errorMessage = 'Invalid API key or quota issue';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
          
          if (errorMessage.includes('exceeded your current quota')) {
            errorMessage = 'API Quota Exceeded. This API key has no credits.\n\nPlease:\n1. Add credits at platform.openai.com\n2. Or use a different API key';
          } else if (errorMessage.includes('Incorrect API key')) {
            errorMessage = 'Invalid API Key. Please check your key.';
          }
        }
      } catch (e) {
        // Ignore parse error
      }
      
      throw new Error(errorMessage);
    }
    
    // API key works!
    console.log('API key verified successfully');
    
    // Update UI
    connected = true;
    els.orbStatus.textContent = 'Connected (Chat Mode with GPT-3.5)';
    els.connectBtn.textContent = 'Disconnect';
    els.voiceBtn.disabled = false;
    els.textInput.disabled = false;
    els.sendBtn.disabled = false;
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
  
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  
  els.orbStatus.textContent = 'Disconnected';
  els.connectBtn.textContent = 'Connect';
  els.voiceBtn.disabled = true;
  els.textInput.disabled = true;
  els.sendBtn.disabled = true;
  els.statusDot?.classList.remove('connected');
  
  console.log('Disconnected');
}

async function startRecording() {
  if (!connected) {
    console.log('Not connected');
    return;
  }
  
  try {
    console.log('Starting speech recognition...');
    
    // Initialize Web Speech API recognition
    if (!recognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser');
      }
      
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;  // Stop after getting result
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      // Handle results
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        console.log('Interim transcript:', transcript);
        
        // Update status to show interim results
        if (event.results[0].isFinal) {
          console.log('Final transcript:', transcript);
          
          // Prevent multiple processing
          if (!isProcessing && transcript.trim().length > 0) {
            els.orbStatus.textContent = 'Processing...';
            recognition.stop();  // Stop recognition while processing
            processTranscript(transcript);
          }
        } else {
          els.orbStatus.textContent = 'Listening: ' + transcript.substring(0, 30) + '...';
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        els.voiceOrb?.classList.remove('listening');
        els.orbStatus.textContent = 'Error: ' + event.error;
        
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please check your browser settings.');
        } else {
          alert('Speech recognition error: ' + event.error);
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        els.voiceOrb?.classList.remove('listening');
        
        // Only restart if in continuous mode and we should restart
        if (continuousMode && connected && shouldRestartRecognition) {
          console.log('Restarting recognition (continuous mode)');
          setTimeout(() => {
            if (connected && continuousMode && !isProcessing) {
              shouldRestartRecognition = false;
              recognition.start();
              els.voiceOrb?.classList.add('listening');
            }
          }, 1000);  // Wait a bit longer before restarting
        }
      };
    }
    
    // Start recognition
    recognition.start();
    els.voiceOrb?.classList.add('listening');
    els.orbStatus.textContent = 'Listening...';
    
    // Set flag for continuous mode
    if (continuousMode) {
      shouldRestartRecognition = true;
    }
    
  } catch (error) {
    console.error('Speech recognition error:', error);
    alert('Could not start speech recognition: ' + error.message);
  }
}

function stopRecording() {
  if (recognition) {
    recognition.stop();
    console.log('Stopping speech recognition');
  }
}

async function processTranscript(text) {
  // Prevent multiple simultaneous calls
  if (isProcessing) {
    console.log('Already processing, ignoring duplicate call');
    return;
  }
  
  isProcessing = true;
  
  try {
    // Get API key
    let apiKey = els.apiKeyInput?.value.trim();
    if (!apiKey) {
      const stored = await chrome.storage.local.get(['openaiApiKey']);
      apiKey = stored.openaiApiKey;
    }
    
    console.log('Processing transcript:', text);
    console.log('Using API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'No API key!');
    
    if (!apiKey) {
      throw new Error('No API key found. Please enter your OpenAI API key in settings.');
    }
    
    // Show user message immediately
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
        model: 'gpt-3.5-turbo', // Much cheaper than GPT-4!
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: text }
        ]
      })
    });
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      let errorMessage = 'ChatGPT API error';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
          
          // Handle specific error types
          if (errorMessage.includes('exceeded your current quota')) {
            errorMessage = 'API Quota Exceeded: Please check your OpenAI account billing and usage limits at platform.openai.com';
          } else if (errorMessage.includes('Incorrect API key')) {
            errorMessage = 'Invalid API Key: Please check your OpenAI API key in settings';
          } else if (errorMessage.includes('Rate limit')) {
            errorMessage = 'Rate Limit: Too many requests. Please wait a moment and try again';
          }
        }
      } catch (e) {
        errorMessage = errorText.substring(0, 200); // Limit error length
      }
      
      throw new Error(errorMessage);
    }
    
    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;
    
    // Show AI response immediately
    addMessage('assistant', aiResponse);
    
    // Speak response using OpenAI TTS
    els.orbStatus.textContent = 'Generating speech...';
    await speakWithOpenAI(aiResponse, apiKey);
    
    els.orbStatus.textContent = 'Connected (Chat Mode with GPT-3.5)';
    
  } catch (error) {
    console.error('Processing error:', error);
    els.orbStatus.textContent = 'Error occurred';
    
    // Create a more user-friendly error message
    let displayMessage = error.message;
    
    // Add helpful suggestions based on error type
    if (error.message.includes('Quota Exceeded')) {
      displayMessage += '\n\nSuggestions:\n';
      displayMessage += '1. Check your OpenAI billing at platform.openai.com\n';
      displayMessage += '2. Add payment method or credits to your account\n';
      displayMessage += '3. Try using a different API key with available credits';
    } else if (error.message.includes('Invalid API Key')) {
      displayMessage += '\n\nPlease get your API key from platform.openai.com/api-keys';
    }
    
    alert(displayMessage);
  } finally {
    // Reset processing flag
    isProcessing = false;
    
    // Set flag to restart recognition if in continuous mode
    if (continuousMode) {
      shouldRestartRecognition = true;
    }
  }
}

async function speakWithOpenAI(text, apiKey) {
  try {
    console.log('Generating speech with OpenAI TTS...');
    
    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',  // or 'tts-1-hd' for higher quality
        input: text,
        voice: selectedVoice   // Use the selected voice from settings
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API error:', errorText);
      
      // Fallback to browser TTS if OpenAI TTS fails
      console.log('Falling back to browser TTS...');
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      return;
    }
    
    // Get audio data
    const audioBlob = await response.blob();
    
    // Create audio element and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Clean up URL when done
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(audioUrl);
    });
    
    // Play the audio
    await audio.play();
    console.log('Speech playback started');
    
  } catch (error) {
    console.error('Error with OpenAI TTS:', error);
    
    // Fallback to browser TTS
    console.log('Using browser TTS as fallback');
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
}

function addMessage(role, content) {
  if (!els.chatContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.style.cssText = role === 'user' 
    ? 'background: #3b82f6; color: white; padding: 10px 15px; border-radius: 18px; margin: 8px 0; max-width: 80%; align-self: flex-end; margin-left: auto; word-wrap: break-word;'
    : 'background: #374151; color: white; padding: 10px 15px; border-radius: 18px; margin: 8px 0; max-width: 80%; align-self: flex-start; word-wrap: break-word;';
  
  // Support clickable links
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const htmlContent = content.replace(linkRegex, '<a href="$1" target="_blank" style="color: #60a5fa; text-decoration: underline;">$1</a>');
  messageDiv.innerHTML = htmlContent;
  
  els.chatContainer.appendChild(messageDiv);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
  
  // Show chat container if hidden
  if (els.chatContainer.style.display === 'none') {
    els.chatContainer.style.display = 'flex';
    els.chatContainer.style.flexDirection = 'column';
    els.chatContainer.style.padding = '10px';
    const orbWrapper = document.getElementById('voiceOrbWrapper');
    if (orbWrapper) {
      orbWrapper.style.display = 'none';
    }
  }
  
  // Save to conversation history
  const message = { 
    role, 
    content, 
    timestamp: new Date().toISOString() 
  };
  conversationHistory.push(message);
  
  // Limit history to last 50 messages
  if (conversationHistory.length > 50) {
    conversationHistory = conversationHistory.slice(-50);
  }
  
  // Save to storage
  chrome.storage.local.set({ conversationHistory });
}

// Initialize voice dropdown with OpenAI voice options
function initializeVoiceDropdown() {
  if (!els.voiceSelect) return;
  
  const voices = [
    { value: 'alloy', name: 'Alloy (Neutral)' },
    { value: 'echo', name: 'Echo (Male)' },
    { value: 'fable', name: 'Fable (British)' },
    { value: 'onyx', name: 'Onyx (Deep Male)' },
    { value: 'nova', name: 'Nova (Female)' },
    { value: 'shimmer', name: 'Shimmer (Soft Female)' }
  ];
  
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.value;
    option.textContent = voice.name;
    els.voiceSelect.appendChild(option);
  });
}

// Load all settings from storage
function loadAllSettings() {
  chrome.storage.local.get([
    'continuousMode', 
    'selectedVoice', 
    'memoryEnabled',
    'conversationHistory'
  ], (result) => {
    // Continuous mode
    if (result.continuousMode !== undefined) {
      continuousMode = result.continuousMode;
      if (els.continuousModeCheckbox) {
        els.continuousModeCheckbox.checked = continuousMode;
      }
    }
    
    // Voice selection
    if (result.selectedVoice) {
      selectedVoice = result.selectedVoice;
      if (els.voiceSelect) {
        els.voiceSelect.value = selectedVoice;
      }
    }
    
    // Memory enabled
    if (result.memoryEnabled !== undefined && els.memoryEnabled) {
      els.memoryEnabled.checked = result.memoryEnabled;
    }
    
    // Conversation history
    if (result.conversationHistory) {
      conversationHistory = result.conversationHistory;
    }
    
    console.log('Settings loaded:', { continuousMode, selectedVoice });
  });
}

// View knowledge base
function viewKnowledgeBase() {
  if (conversationHistory.length === 0) {
    alert('No conversation history yet. Start chatting to build your knowledge base!');
    return;
  }
  
  // Create a simple display of conversation history
  let historyText = 'Conversation History:\n\n';
  conversationHistory.forEach((entry, index) => {
    historyText += `${index + 1}. ${entry.role}: ${entry.content.substring(0, 100)}...\n`;
  });
  
  alert(historyText);
}

// Clear memory
function clearMemory() {
  if (confirm('Are you sure you want to clear all conversation history?')) {
    conversationHistory = [];
    chrome.storage.local.set({ conversationHistory: [] });
    
    // Clear chat display
    if (els.chatContainer) {
      els.chatContainer.innerHTML = '';
    }
    
    console.log('Memory cleared');
    alert('Conversation history cleared!');
  }
}

// Send text message from input field
async function sendTextMessage() {
  const text = els.textInput?.value.trim();
  if (!text || !connected) return;
  
  // Clear input
  els.textInput.value = '';
  
  // Process the message
  await processTranscript(text);
}

console.log('Atlas Voice Extension loaded');