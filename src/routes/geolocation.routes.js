
const express = require("express");
const rateLimit = require("express-rate-limit");
const { geolocate } = require("../controllers/geolocation.controller");

const router = express.Router();

const defaultWindowMs = 15 * 60 * 1000;
const defaultMaxRequests = 100;

const configuredWindowMs = Number.parseInt(
  process.env.GEOLOCATION_RATE_LIMIT_WINDOW_MS || "",
  10
);
const configuredMaxRequests = Number.parseInt(
  process.env.GEOLOCATION_RATE_LIMIT_MAX || "",
  10
);

const geolocationRateLimiter = rateLimit({
  windowMs:
    Number.isFinite(configuredWindowMs) && configuredWindowMs > 0
      ? configuredWindowMs
      : defaultWindowMs,
  max:
    Number.isFinite(configuredMaxRequests) && configuredMaxRequests > 0
      ? configuredMaxRequests
      : defaultMaxRequests,
  legacyHeaders: false,
  standardHeaders: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      },
    });
  },
});

router.get("/", geolocationRateLimiter, geolocate);

module.exports = router;
