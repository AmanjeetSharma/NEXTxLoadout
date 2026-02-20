import { ChatGroq } from '@langchain/groq';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { DynamicTool } from 'langchain/tools';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';

dotenv.config();

const mongoTool = new DynamicTool({
  name: 'queryMongo',
  description: 'Query MongoDB. After that return results in natural language.',
  func: async (input) => {
    try {
      const query = JSON.parse(input);

      // Use Mongoose Product model
      const results = await Product.find(query).limit(5);
      return JSON.stringify(results);
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  },
});

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.1,
});

export const setupAgent = async () => {
  const executor = await initializeAgentExecutorWithOptions(
    [mongoTool],
    llm,
    {
      agentType: 'zero-shot-react-description',
      verbose: true,
    }
  );
  return executor;
};
