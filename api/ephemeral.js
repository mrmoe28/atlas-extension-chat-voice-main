export default async function handler(req, res) {
  // Enable CORS with explicit headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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