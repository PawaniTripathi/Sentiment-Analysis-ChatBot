/**
 * Analysis Controller
 * Handles sentiment analysis requests
 */

const { analyzeText } = require("../services/openRouterService");

/**
 * POST /api/analysis/analyze
 * Analyzes the provided text and returns structured sentiment data
 */
const analyzeTextController = async (req, res) => {
  try {
    const { text, conversationHistory } = req.body;

    // ─── Input Validation ────────────────────────────────────────────────────
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Please provide text to analyze.",
      });
    }

    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Text cannot be empty. Please enter some content to analyze.",
      });
    }

    if (trimmedText.length > 5000) {
      return res.status(400).json({
        success: false,
        error: "Text is too long. Please limit input to 5000 characters.",
      });
    }

    // ─── Perform Analysis ────────────────────────────────────────────────────
    console.log(`📊 Analyzing text (${trimmedText.length} chars)...`);

    const analysisResult = await analyzeText(trimmedText, conversationHistory || []);

    console.log(`✅ Analysis complete: ${analysisResult.sentiment} (${analysisResult.confidence}%)`);

    return res.status(200).json({
      success: true,
      data: {
        ...analysisResult,
        analyzedText: trimmedText,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Analysis error:", error.message);

    // Handle specific error types
    if (error.message.includes("API key")) {
      return res.status(503).json({
        success: false,
        error: "AI service is not configured. Please contact the administrator.",
      });
    }

    if (error.response?.status === 429 || error.message.includes("rate-limited")) {
      return res.status(429).json({
        success: false,
        error: "Free AI model rate limit reached. Please wait 10–20 seconds and try again.",
      });
    }

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return res.status(504).json({
        success: false,
        error: "Analysis timed out. Please try with shorter text.",
      });
    }

    return res.status(503).json({
      success: false,
      error: "The AI service is currently unavailable or returned an error. Please try again.",
    });
  }
};

module.exports = { analyzeTextController };
