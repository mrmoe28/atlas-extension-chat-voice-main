export default async function handler(req, res) {
  // Enable CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Desktop commands don't work in Vercel serverless environment
  return res.status(501).json({ 
    error: 'Desktop commands not available in serverless environment',
    success: false,
    message: 'Please run the server locally for desktop control features'
  });
}