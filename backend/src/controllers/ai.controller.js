import { setupAgent } from '../utils/agent.js';

export const askAI = async (req, res) => {
  console.log("🔍 AI Request Received:", req.body);
  const { input } = req.body;
  console.log("📥 User Input in backend:", input);

  if (!input) return res.status(400).json({ error: 'Input is required' });

  try {
    const executor = await setupAgent();
    
    // Add a timeout to prevent hanging
    const result = await Promise.race([
      executor.invoke({ input }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      )
    ]);

    console.log("🤖 Raw Agent Output:", result);
    
    // Just use whatever the agent returns - it should already be natural language
    const finalReply = result.output || "I couldn't process that request. Could you please rephrase?";
    
    console.log("🧠 AI Response:", finalReply);
    res.json({ response: finalReply });

  } catch (err) {
    console.error("❌ Error:", err);
    
    // Provide a more helpful error message
    let errorMessage = 'Internal Server Error';
    if (err.message.includes('timeout')) {
      errorMessage = 'Request took too long. Please try a simpler query.';
    } else if (err.message.includes('max iterations')) {
      errorMessage = 'I had trouble processing your request. Try being more specific, like "show me all Razer mice" or "Logitech products under 1000".';
    }
    
    res.status(500).json({ error: errorMessage });
  }
};