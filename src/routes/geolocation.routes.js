const rateLimit = require("express-rate-limit");
const express = require("express");
const { geolocate } = require("../controllers/geolocation.controller");

const router = express.Router();

const geolocationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.GEOLOCATION_RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    },
  },
});

router.get("/", geolocationRateLimiter ,geolocate);

module.exports = router;
