require("dotenv").config();

const express = require("express");
const geolocationRoutes = require("./routes/geolocation.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IPLocate API is running",
  });
});

app.use("/api/geolocate", geolocationRoutes);

app.listen(PORT, () => {
  console.log(`IPLocate API running on http://localhost:${PORT}`);
});
