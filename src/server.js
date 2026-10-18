
require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IPLocate API is running",
  });
});

app.listen(PORT, () => {
  console.log(`IPLocate API running on http://localhost:${PORT}`);
});
