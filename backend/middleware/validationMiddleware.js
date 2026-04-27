/**
 * Validation Middleware
 * Sanitizes and validates incoming request bodies
 */

/**
 * Checks that the request body is not empty and is a valid JSON object
 */
const validateRequest = (req, res, next) => {
  // Ensure Content-Type is application/json
  if (req.method === "POST" && !req.is("application/json")) {
    return res.status(415).json({
      success: false,
      error: "Content-Type must be application/json",
    });
  }

  // Check body exists
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: "Request body cannot be empty.",
    });
  }

  next();
};

module.exports = { validateRequest };
