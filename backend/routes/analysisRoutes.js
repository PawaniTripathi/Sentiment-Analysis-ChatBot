/**
 * Analysis Routes
 * Defines API endpoints for text analysis
 */

const express = require("express");
const router = express.Router();
const { analyzeTextController } = require("../controllers/analysisController");
const { validateRequest } = require("../middleware/validationMiddleware");

/**
 * POST /api/analysis/analyze
 * Body: { text: string, conversationHistory: Array }
 * Returns: structured sentiment analysis result
 */
router.post("/analyze", validateRequest, analyzeTextController);

module.exports = router;
