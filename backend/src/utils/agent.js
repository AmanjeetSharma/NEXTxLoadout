import { ChatGroq } from '@langchain/groq';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { DynamicTool } from 'langchain/tools';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';

dotenv.config();

// Helper function to parse natural language to MongoDB query
const parseQuery = (input) => {
  if (!input || typeof input !== 'string') {
    return {};
  }
  
  input = input.toLowerCase().trim();
  
  // Simple keyword matching
  const brands = ['razer', 'logitech', 'corsair', 'hyperx', 'asus', 'msi', 'apple', 'dell', 'hp'];
  const categories = ['mouse', 'keyboard', 'monitor', 'laptop', 'headphone', 'speaker'];
  
  for (const brand of brands) {
    if (input.includes(brand)) {
      return { brand: { $regex: new RegExp(brand, 'i') } };
    }
  }
  
  for (const category of categories) {
    if (input.includes(category)) {
      return { category: { $regex: new RegExp(category, 'i') } };
    }
  }
  
  return {
    $or: [
      { name: { $regex: input, $options: 'i' } },
      { brand: { $regex: input, $options: 'i' } },
      { category: { $regex: input, $options: 'i' } }
    ]
  };
};

const mongoTool = new DynamicTool({
  name: "queryMongo",
  description: "Search for products in MongoDB. Input can be JSON or natural language.",
  func: async (input) => {
    try {
      let query = {};
      
      // Parse input
      if (typeof input === 'object' && input !== null) {
        query = input;
      } else if (typeof input === 'string') {
        try {
          query = JSON.parse(input);
        } catch {
          query = parseQuery(input);
        }
      }
      
      // Get products
      const results = await Product.find(query)
        .limit(10)
        .lean();
      
      return JSON.stringify(results);
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
});

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.1,
});

export const setupAgent = async () => {
  return await initializeAgentExecutorWithOptions(
    [mongoTool],
    llm,
    {
      agentType: "chat-zero-shot-react-description",
      verbose: true,
      maxIterations: 5,
      agentArgs: {
        systemMessage: "You are a shopping assistant. Use the queryMongo tool to find products, then return the raw data.",
      },
    }
  );
}; 