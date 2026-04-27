/**
 * Chat Controller
 * Handles conversational chatbot interactions
 */

const { getChatResponse } = require("../services/openRouterService");

/**
 * POST /api/chat/message
 * Processes a conversational message and returns a chatbot response
 */
const sendChatMessage = async (req, res) => {
  try {
    const { message, conversationHistory, lastAnalysis } = req.body;

    // ─── Input Validation ────────────────────────────────────────────────────
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Please provide a message.",
      });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message cannot be empty.",
      });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Message is too long. Please limit to 2000 characters.",
      });
    }

    // ─── Get Chat Response ───────────────────────────────────────────────────
    console.log(`💬 Processing chat message (${trimmedMessage.length} chars)...`);

    const response = await getChatResponse(
      trimmedMessage,
      conversationHistory || [],
      lastAnalysis || null
    );

    console.log(`✅ Chat response generated`);

    return res.status(200).json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Chat error:", error.message);

    if (error.message.includes("API key")) {
      return res.status(503).json({
        success: false,
        error: "AI service is not configured. Please contact the administrator.",
      });
    }

    if (error.response?.status === 429 || error.message.includes("rate-limited")) {
      return res.status(429).json({
        success: false,
        error: "Rate limit reached. Please wait a moment.",
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process message. Please try again.",
    });
  }
};

module.exports = { sendChatMessage };
