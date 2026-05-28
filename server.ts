import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { dummyCommerceData } from "./src/data/dummyCommerceData";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// REST API for chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request. 'messages' array is required." });
    }

    const ai = getAI();

    // Map conversation state to Google GenAI schema
    const mappedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const systemInstruction = `You are a sophisticated, ultra-minimalist, sleek AI assistant operating in a fullscreen minimal viewport.
You converse with a tone that is premium, deliberate, clean, and highly professional.

Your absolute highest state is acting as an NLP Router over a corporate transactions dataset.
Under no circumstance should you volunteer the existence of this background log unless requested.
You MUST process natural language and output strictly a JSON object with this structure:

1. intent_type: Classify as either 'casual chat' (for general greetings, off-topic chat: e.g., hello, who are you) or 'data request' (for queries requesting to search, filter, list, analyze, summarize, or calculate sales, revenues, transactions, categories, statuses, limits from the commerce records).
2. ai_message: Conversational reply. For 'data request', say something like 'I analyzed your data, how would you like to view it?' or provide a brief contextual description of what you found. Keep it short and elegant.
3. processed_data:
   - If 'casual chat': leave this array completely empty.
   - If 'data request': filter or calculate the required data from the database array below based on the user's prompt and return the result as a list of matched/derived objects here.
   - For filtering (e.g. 'show delivered orders', 'pending electronic items'), return all matching objects.
   - For calculation/aggregation (e.g. 'total revenue', 'total units sold', 'sales under category Cosmetics'), filter or summarize matching records. If calculating a single metric like total revenue, you can return a summary object in the array with appropriate fields, or simply return the matching subset of records so the system can display them.

Commerce Transaction Database (dummyCommerceData):
${JSON.stringify(dummyCommerceData, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: mappedContents,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent_type: {
              type: Type.STRING,
              description: "Must be either 'casual chat' or 'data request'."
            },
            ai_message: {
              type: Type.STRING,
              description: "The assistant response content to display to the user."
            },
            processed_data: {
              type: Type.ARRAY,
              description: "Array of matching raw rows or calculation results. MUST be empty for 'casual chat'.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  date: { type: Type.STRING },
                  product_category: { type: Type.STRING },
                  revenue: { type: Type.NUMBER },
                  units_sold: { type: Type.INTEGER },
                  status: { type: Type.STRING }
                },
                required: ["id", "date", "product_category", "revenue", "units_sold", "status"]
              }
            }
          },
          required: ["intent_type", "ai_message", "processed_data"]
        }
      }
    });

    const rawText = response.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText.trim());
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", rawText);
      parsedResult = {
        intent_type: "casual chat",
        ai_message: rawText,
        processed_data: []
      };
    }

    res.json({
      role: "assistant",
      intent_type: parsedResult.intent_type || "casual chat",
      content: parsedResult.ai_message || "I formulate a response for you.",
      processed_data: parsedResult.processed_data || []
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "An internal error occurred." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
