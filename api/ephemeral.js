export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client_secret = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
    const endpoint = 'https://api.openai.com/v1/realtime';
    
    if (!client_secret) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'OPENAI_API_KEY not configured in environment variables' 
      });
    }
    
    console.log(`Providing credentials for model: ${model}`);
    
    return res.status(200).json({
      client_secret,
      model,
      endpoint
    });
  } catch (error) {
    console.error('Error in /api/ephemeral:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}