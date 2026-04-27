/**
 * Chat Routes
 * Defines API endpoints for chatbot interactions
 */

const express = require("express");
const router = express.Router();
const { sendChatMessage } = require("../controllers/chatController");
const { validateRequest } = require("../middleware/validationMiddleware");

/**
 * POST /api/chat/message
 * Body: { message: string, conversationHistory: Array, lastAnalysis: Object }
 * Returns: chatbot response string
 */
router.post("/message", validateRequest, sendChatMessage);

module.exports = router;
