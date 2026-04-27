/**
 * AI Sentiment Intelligence System - Main Server
 * Entry point for the Express backend application
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Import routes
const analysisRoutes = require("./routes/analysisRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Import error handling middleware
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet()); // Adds security HTTP headers

// Rate limiting: prevent abuse (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ─── CORS Configuration ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,          // e.g. https://your-app.vercel.app
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, mobile apps)
      if (!origin) return callback(null, true);
      // Allow whitelisted origins OR any *.vercel.app preview URL
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Body Parsing Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Health Check Route ──────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "AI Sentiment Intelligence System",
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/analysis", analysisRoutes);
app.use("/api/chat", chatRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 AI Sentiment Intelligence System Backend`);
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Ready to analyze sentiments!\n`);

  // ─── Keep-Alive Self-Ping (Render free tier) ──────────────────────────────
  // Render spins down free services after 15 min of inactivity, causing cold
  // starts that take 30-60s and look like errors to the user.
  // Pinging /health every 14 min keeps the dyno awake at zero extra cost.
  if (process.env.NODE_ENV === "production" && process.env.RENDER_EXTERNAL_URL) {
    const https = require("https");
    const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/health`;

    setInterval(() => {
      https.get(pingUrl, (res) => {
        console.log(`🏓 Keep-alive ping → ${res.statusCode}`);
      }).on("error", (err) => {
        console.warn(`⚠️  Keep-alive ping failed: ${err.message}`);
      });
    }, 14 * 60 * 1000); // every 14 minutes

    console.log(`🏓 Keep-alive pinger active → ${pingUrl}`);
  }
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully…`);
  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
  // Force exit after 10s if connections are still open
  setTimeout(() => process.exit(1), 10000);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

module.exports = app;
