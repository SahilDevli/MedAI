// chatgpt.js
const OpenAI = require("openai");
require("dotenv").config();

// OpenRouter client
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "MedicBot",
  },
});

// Safe JSON parser (fallback protection)
function extractJSON(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;

    if (start === -1 || end === -1) throw new Error("No JSON found");

    const jsonString = text.slice(start, end);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("JSON extraction failed:", err);
    return {
      precautions: [],
      medicines: [],
      warning:
        "Hello! Please describe your symptoms so I can help. Always consult a doctor.",
    };
  }
}

async function askChatGPT(userMessage) {
  try {
    const response = await client.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        {
          role: "system",
          content: `
        You are MedAI, an AI-powered medical assistant chatbot.
        
        IDENTITY:
        - Your name is MedAI
        - You are a training-purpose medical chatbot
        - You suggest general medical precautions and commonly used medicines
        - You are NOT a doctor and do NOT replace professional medical advice
        
        RULES:
        - Always respond in valid JSON
        - Never use markdown
        - Never return plain text
        - Never explain the JSON format
        - Do NOT diagnose diseases
        - Do NOT provide emergency decisions
        
        RESPONSE FORMAT (ALWAYS):
        {
          "precautions": [],
          "medicines": [],
          "warning": ""
        }
        
        BEHAVIOR:
        - If user asks about your name, identity, purpose, or who you are:
          → Respond in "warning" with:
            "I am MedAI, a training-purpose medical chatbot. I provide general precautions and common medicine suggestions related to health issues."
        
        - If user greets (hi, hello, hey):
          → Respond in "warning" with a friendly greeting and ask for symptoms
        
        - If input is non-medical:
          → Ask the user to describe their health issue in "warning"
        
        - If input is medical:
          → Fill "precautions" and "medicines"
          → Include doctor advice in "warning"
        
        - Always keep responses concise and safe
          `.trim(),
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const rawText = response.choices[0].message.content;

    return extractJSON(rawText);
  } catch (err) {
    console.error("OpenRouter error:", err);

    return {
      precautions: [],
      medicines: [],
      warning: "Unable to generate response. Please consult a doctor.",
    };
  }
}

module.exports = askChatGPT;
