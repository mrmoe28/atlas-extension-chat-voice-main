// Simple Database API for saving conversation history
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (req.method === 'POST') {
      // Save conversation message
      const { role, content, timestamp } = req.body;
      
      await sql`
        INSERT INTO conversations (role, content, timestamp)
        VALUES (${role}, ${content}, ${timestamp})
      `;
      
      return res.status(200).json({ success: true });
      
    } else if (req.method === 'GET') {
      // Retrieve conversation history
      const { rows } = await sql`
        SELECT * FROM conversations 
        ORDER BY timestamp DESC 
        LIMIT 100
      `;
      
      return res.status(200).json({ conversations: rows });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database operation failed' });
  }
}