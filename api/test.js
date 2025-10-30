export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasRealtimeModel: !!process.env.OPENAI_REALTIME_MODEL
    }
  });
}