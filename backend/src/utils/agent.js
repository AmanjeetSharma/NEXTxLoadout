import { ChatGroq } from '@langchain/groq';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { DynamicTool } from 'langchain/tools';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';

dotenv.config();

// Helper function to parse natural language to MongoDB query
const parseQuery = (input) => {
  // Handle case when input is undefined or not a string
  if (!input || typeof input !== 'string') {
    console.log("⚠️ Invalid input to parseQuery:", input);
    return {}; // Return empty query for all products
  }

  input = input.toLowerCase().trim();
  console.log("🔤 Parsing query string:", input);

  // Handle "all products" or "all [brand]" queries
  if (input.includes('all') || input.includes('every') || input.includes('show me')) {
    // Check for brand first
    const brands = ['razer', 'logitech', 'corsair', 'hyperx', 'steelseries', 'apple', 'dell', 'hp', 'asus', 'msi'];
    for (const brand of brands) {
      if (input.includes(brand)) {
        console.log(`🏷️ Detected brand: ${brand}`);
        return { brand: { $regex: new RegExp(brand, 'i') } };
      }
    }

    // Then check for categories
    const categories = ['mouse', 'keyboard', 'laptop', 'monitor', 'headphone', 'speaker', 'headset'];
    for (const category of categories) {
      if (input.includes(category)) {
        console.log(`📦 Detected category: ${category}`);
        return { category: { $regex: new RegExp(category, 'i') } };
      }
    }

    // If no specific filter, return empty query for all products
    console.log("📋 No specific filter detected, returning all products");
    return {};
  }

  // Handle specific brand queries
  if (input.includes('brand') || input.includes('from')) {
    const brands = ['razer', 'logitech', 'corsair', 'hyperx', 'steelseries', 'apple', 'dell', 'hp', 'asus', 'msi'];
    for (const brand of brands) {
      if (input.includes(brand)) {
        console.log(`🏷️ Detected brand from brand query: ${brand}`);
        return { brand: { $regex: new RegExp(brand, 'i') } };
      }
    }
  }

  // Handle price range queries
  if (input.includes('under') || input.includes('below') || input.includes('less than')) {
    const priceMatch = input.match(/(\d+)/);
    if (priceMatch) {
      console.log(`💰 Detected price under: ${priceMatch[0]}`);
      return { finalPrice: { $lte: parseInt(priceMatch[0]) } };
    }
  }

  if (input.includes('above') || input.includes('over') || input.includes('more than')) {
    const priceMatch = input.match(/(\d+)/);
    if (priceMatch) {
      console.log(`💰 Detected price above: ${priceMatch[0]}`);
      return { finalPrice: { $gte: parseInt(priceMatch[0]) } };
    }
  }

  // Direct brand/category detection without keywords
  const brands = ['razer', 'logitech', 'corsair', 'hyperx', 'steelseries', 'apple', 'dell', 'hp', 'asus', 'msi'];
  for (const brand of brands) {
    if (input.includes(brand)) {
      console.log(`🏷️ Detected direct brand: ${brand}`);
      return { brand: { $regex: new RegExp(brand, 'i') } };
    }
  }

  const categories = ['mouse', 'keyboard', 'laptop', 'monitor', 'headphone', 'speaker', 'headset'];
  for (const category of categories) {
    if (input.includes(category)) {
      console.log(`📦 Detected direct category: ${category}`);
      return { category: { $regex: new RegExp(category, 'i') } };
    }
  }

  // Default: try to match against name, brand, or category
  console.log("🔍 Using default search with input:", input);
  return {
    $or: [
      { name: { $regex: input, $options: 'i' } },
      { brand: { $regex: input, $options: 'i' } },
      { category: { $regex: input, $options: 'i' } },
      { description: { $regex: input, $options: 'i' } }
    ]
  };
};

const mongoTool = new DynamicTool({
  name: "queryMongo",
  description: `
Use this tool to fetch products from MongoDB.
Input can be either:
1. A JSON string: {{"brand": "razer"}}
2. Natural language: "all razer products"

Examples:
- {{"brand": "razer"}} - Get all Razer products
- {{"category": "mouse"}} - Get all mice
- {{}} - Get all products
- "all razer products" - Will be automatically parsed
- "show me mice under 100" - Will be parsed appropriately
`,
  func: async (input) => {
    try {
      console.log("🔍 Tool received input type:", typeof input);
      console.log("🔍 Tool received input value:", input);

      let query = {};
      let inputString = input;

      // Handle if input is an object (might be passed as object by the agent)
      if (typeof input === 'object' && input !== null) {
        console.log("📦 Input is an object, checking structure");

        // If it has a brand property directly
        if (input.brand) {
          console.log("🏷️ Found brand property in object:", input.brand);
          query = { brand: { $regex: new RegExp(input.brand, 'i') } };
        }
        // If it has other MongoDB-like structure
        else if (Object.keys(input).length > 0) {
          console.log("🔧 Using object as query directly");
          query = input;
        }
        // If it's an empty object
        else {
          console.log("📋 Empty object detected, returning all products");
          query = {};
        }
      }
      // Try to parse as JSON first if it's a string
      else if (typeof input === 'string') {
        try {
          query = JSON.parse(input);
          console.log("📊 Parsed JSON query:", query);
        } catch {
          // If not valid JSON, try natural language parsing
          console.log("🔄 Input is not JSON, attempting natural language parsing");
          query = parseQuery(input);
          console.log("📊 Natural language parsed query:", query);
        }
      }

      console.log("📝 Final query to execute:", JSON.stringify(query));

      // Execute the query with a reasonable limit
      const results = await Product.find(query)
        .limit(10)
        .select('name brand price discount finalPrice stock rating description category')
        .lean();

      console.log(`📦 Found ${results.length} products`);

      if (results.length === 0) {
        return JSON.stringify({
          message: "No products found matching your criteria.",
          query: query
        });
      }

      return JSON.stringify(results);
    } catch (err) {
      console.error("❌ Tool error:", err);
      return JSON.stringify({
        error: `Error fetching products: ${err.message}`,
        suggestion: "Try a simpler query like 'all products' or 'razer products'"
      });
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
      returnIntermediateSteps: true,
      handleParsingErrors: true,
    }
  );
};