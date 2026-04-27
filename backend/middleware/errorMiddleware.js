/**
 * Error Handling Middleware
 * Centralized error responses for the entire application
 */

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found.`,
  });
};

/**
 * Global error handler
 * Catches all errors thrown in route handlers
 */
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Unhandled Error:", err.stack);

  // CORS errors
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      error: "Cross-origin request blocked.",
    });
  }

  // JSON parse errors
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON in request body.",
    });
  }

  // Payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: "Request payload is too large.",
    });
  }

  const status = err.statusCode || err.status || 500;
  return res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred."
      : err.message || "Internal server error.",
  });
};

module.exports = { errorHandler, notFoundHandler };
