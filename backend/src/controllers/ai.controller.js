import Product from "../models/product.model.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const askAI = async (req, res) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: "Input is required" });
  }

  try {
    // STEP 1: Convert natural language to Mongo query
    const queryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a MongoDB query generator.
Return ONLY valid JSON.
Product schema fields:
name, brand, model, category, price, rating, stock, tags
`
        },
        {
          role: "user",
          content: input
        }
      ],
      temperature: 0
    });

    const mongoQuery = JSON.parse(queryResponse.choices[0].message.content);

    // STEP 2: Execute query safely
    const products = await Product.find(mongoQuery).limit(5);

    // STEP 3: Convert result to natural language
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an ecommerce assistant. Explain results clearly."
        },
        {
          role: "user",
          content: `
User asked: ${input}
Database result: ${JSON.stringify(products)}
`
        }
      ]
    });

    res.json({
      response: finalResponse.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
};