/**
 * AI Service
 * Handles communication with Gemini directly first, then falls back to OpenRouter only if configured.
 * API keys are NEVER exposed to the frontend.
 */

const axios = require("axios");

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-pro",
];

const FREE_MODELS = [
  "google/gemini-2.5-flash:free",           // Very fast and reliable
  "meta-llama/llama-3.1-8b-instruct:free",  // Usually online
  "qwen/qwen-2.5-72b-instruct:free",        // Good fallback
  "meta-llama/llama-3.3-70b-instruct:free", // Kept just in case
];

const createGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "Gemini API key is not configured. Please set GEMINI_API_KEY in your backend .env file."
    );
  }

  return axios.create({
    baseURL: GEMINI_BASE_URL,
    // 20s per model × 2 models = 40s max — fits inside 90s frontend timeout
    timeout: 20000,
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      key: apiKey.trim(),
    },
  });
};

/**
 * Creates an authenticated Axios instance for OpenRouter API calls
 */
const createOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_openrouter_api_key_here") {
    throw new Error(
      "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your .env file."
    );
  }

  // Use the real deployed frontend URL so OpenRouter doesn't deprioritise localhost referrers
  const referer =
    process.env.FRONTEND_URL || process.env.VITE_API_URL || "http://localhost:3000";

  return axios.create({
    baseURL: OPENROUTER_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "AI Sentiment Intelligence System",
    },
    // 25s per model; with 4 free models max total = 100s, but we stop early on success
    timeout: 25000,
  });
};

const buildAnalysisSystemPrompt = () => {
  return `You are an expert AI Sentiment Intelligence Analyst. Analyze the given text and return ONLY a valid JSON object. Do NOT include markdown, code blocks, or any explanation outside the JSON.

Return this exact JSON structure:
{
  "sentiment": "Positive",
  "confidence": 85,
  "emotions": {
    "happy": 70,
    "sad": 5,
    "angry": 5,
    "neutral": 10,
    "surprise": 5,
    "fear": 5
  },
  "keywords": ["word1", "word2", "word3", "word4", "word5"],
  "suggestion": "Suggestion text here",
  "explanation": "2-3 sentence friendly explanation here",
  "language": "English"
}

Rules:
- sentiment: exactly "Positive", "Negative", or "Neutral"
- confidence: integer 0-100
- emotions: all 6 values, sum ≈ 100
- keywords: 5-8 important words/phrases as strings
- suggestion: if negative/neutral → rewrite positively; if positive → refinement tip
- explanation: warm, friendly, conversational, 2-3 sentences
- language: detect the language, specifically support "English", "Hindi", or "Hinglish" (Hindi written in English alphabet)
- CRITICAL: You MUST flawlessly understand Hinglish (Hindi written in English, e.g., "mujhe bhookh lagi hai").
- Return ONLY the JSON object, nothing else`;
};

const extractJSON = (text) => {
  if (!text) return null;

  try {
    return JSON.parse(text.trim());
  } catch (_) {}

  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch (_) {}

  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  return null;
};

const callGemini = async (messages, temperature = 0.3, maxTokens = 1000) => {
  const client = createGeminiClient();

  // Extract system prompt
  const systemMessage = messages.find((m) => m.role === "system");
  const systemInstruction = systemMessage 
    ? { parts: [{ text: systemMessage.content }] } 
    : undefined;

  // Filter out system message and format others
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  let lastError;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`🤖 Trying Gemini model: ${model}`);
      const response = await client.post(`/models/${model}:generateContent`, {
        systemInstruction,
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error("Gemini returned no text content.");
      }

      console.log(`✅ Success with Gemini model: ${model}`);
      return { data: { choices: [{ message: { content } }] } };
    } catch (err) {
      const status = err.response?.status;
      const errMsg = JSON.stringify(err.response?.data || err.message);

      if (status === 401 || status === 403) {
        throw new Error("Invalid Gemini API key or access denied. Check GEMINI_API_KEY in .env.");
      }

      lastError = err;

      if (status === 429 || status === 404 || status === 400 || status >= 500) {
        console.warn(`⚠️  Gemini model ${model} returned ${status}, trying next...`);
        console.warn(`   Details: ${errMsg}`);
        continue;
      }

      console.error(`❌ Non-recoverable Gemini error from ${model}: ${status} — ${errMsg}`);
      throw err;
    }
  }

  console.error("❌ All Gemini models exhausted or unavailable");
  if (lastError) throw lastError;
  throw new Error("No Gemini model could be reached.");
};

const callOpenRouter = async (messages, temperature = 0.3, maxTokens = 1000) => {
  const client = createOpenRouterClient();
  let lastError;

  for (const model of FREE_MODELS) {
    try {
      console.log(`🤖 Trying OpenRouter model: ${model}`);
      const response = await client.post("/chat/completions", {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      console.log(`✅ Success with OpenRouter model: ${model}`);
      return response;
    } catch (err) {
      const status = err.response?.status;
      const errMsg = JSON.stringify(err.response?.data || err.message);
      lastError = err;

      if (status >= 400 && status < 500) {
        console.warn(`⚠️  OpenRouter model ${model} returned ${status}, trying next...`);
        console.warn(`   Details: ${errMsg}`);
        continue;
      }

      console.error(`❌ Non-recoverable OpenRouter error from ${model}: ${status} — ${errMsg}`);
      throw err;
    }
  }

  console.error("❌ All OpenRouter models rate-limited or unavailable");
  if (lastError) throw lastError;
  throw new Error("All free AI models are currently rate-limited. Please wait 30 seconds and try again.");
};

const callWithFallback = async (messages, temperature = 0.3, maxTokens = 1000) => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "" && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
    try {
      return await callGemini(messages, temperature, maxTokens);
    } catch (error) {
      console.warn("⚠️ Gemini failed, falling back to OpenRouter...", error.message);
      // Fallback to OpenRouter if OpenRouter API Key is set
      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() !== "" && process.env.OPENROUTER_API_KEY !== "your_openrouter_api_key_here") {
        return callOpenRouter(messages, temperature, maxTokens);
      }
      throw error;
    }
  }

  return callOpenRouter(messages, temperature, maxTokens);
};

const analyzeText = async (text, conversationHistory = []) => {
  const messages = [
    {
      role: "system",
      content: buildAnalysisSystemPrompt(),
    },
    ...conversationHistory.slice(-4).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: "user",
      content: `Analyze this text and return ONLY the JSON result:\n\n"${text}"`,
    },
  ];

  const response = await callWithFallback(messages, 0.3, 1000);

  const rawContent = response.data.choices[0]?.message?.content;
  console.log("📨 Raw AI response:", rawContent?.slice(0, 300));

  if (!rawContent) {
    throw new Error("Empty response received from AI model");
  }

  const analysisResult = extractJSON(rawContent);
  if (!analysisResult) {
    console.error("❌ Could not parse JSON from:", rawContent);
    throw new Error("AI returned invalid JSON format");
  }

  validateAnalysisResult(analysisResult);
  return analysisResult;
};

const getChatResponse = async (userMessage, conversationHistory = [], lastAnalysis = null) => {
  const systemPrompt = `You are a friendly and intelligent AI Sentiment Analysis Assistant.
Your personality is warm, helpful, and conversational.

${lastAnalysis ? `The most recent analysis showed:
- Sentiment: ${lastAnalysis.sentiment} (${lastAnalysis.confidence}% confidence)
- Top emotions: ${Object.entries(lastAnalysis.emotions || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}%`)
    .join(", ")}
- Keywords: ${(lastAnalysis.keywords || []).join(", ")}` : ""}

Respond conversationally in 2-4 sentences. Be helpful, empathetic, and insightful.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-8),
    { role: "user", content: userMessage },
  ];

  const response = await callWithFallback(messages, 0.7, 300);

  return (
    response.data.choices[0]?.message?.content ||
    "I'm here to help! Could you please rephrase your question?"
  );
};

const validateAnalysisResult = (result) => {
  if (!result.sentiment || !["Positive", "Negative", "Neutral"].includes(result.sentiment)) {
    result.sentiment = "Neutral";
  }
  if (typeof result.confidence !== "number") {
    result.confidence = 50;
  }
  result.confidence = Math.max(0, Math.min(100, result.confidence));

  if (!result.emotions || typeof result.emotions !== "object") {
    result.emotions = { happy: 20, sad: 20, angry: 10, neutral: 30, surprise: 10, fear: 10 };
  }
  if (!Array.isArray(result.keywords)) {
    result.keywords = [];
  }
  if (!result.suggestion) {
    result.suggestion = "No suggestion available.";
  }
  if (!result.explanation) {
    result.explanation = "No explanation provided.";
  }
  if (!result.language) {
    result.language = "English";
  }
};

module.exports = { analyzeText, getChatResponse };
