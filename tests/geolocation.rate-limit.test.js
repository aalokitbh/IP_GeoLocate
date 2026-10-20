const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

const previousWindowMs = process.env.GEOLOCATION_RATE_LIMIT_WINDOW_MS;
const previousMaxRequests = process.env.GEOLOCATION_RATE_LIMIT_MAX;

process.env.GEOLOCATION_RATE_LIMIT_WINDOW_MS = "60000";
process.env.GEOLOCATION_RATE_LIMIT_MAX = "2";

const geolocationRoutes = require("../src/routes/geolocation.routes");

function createServer() {
  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "IPLocate API is running",
    });
  });

  app.use("/api/geolocate", geolocationRoutes);

  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        server,
      });
    });
  });
}

test("rate limiting returns 429 on exceed and does not block /health", async (t) => {
  const { server, baseUrl } = await createServer();

  t.after(() => {
    server.close();

    if (previousWindowMs === undefined) {
      delete process.env.GEOLOCATION_RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.GEOLOCATION_RATE_LIMIT_WINDOW_MS = previousWindowMs;
    }

    if (previousMaxRequests === undefined) {
      delete process.env.GEOLOCATION_RATE_LIMIT_MAX;
    } else {
      process.env.GEOLOCATION_RATE_LIMIT_MAX = previousMaxRequests;
    }
  });

  const first = await fetch(`${baseUrl}/api/geolocate?ip=not-an-ip`);
  assert.equal(first.status, 400);

  const second = await fetch(`${baseUrl}/api/geolocate?ip=not-an-ip`);
  assert.equal(second.status, 400);

  const third = await fetch(`${baseUrl}/api/geolocate?ip=not-an-ip`);
  assert.equal(third.status, 429);
  assert.deepEqual(await third.json(), {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    },
  });

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {
    success: true,
    message: "IPLocate API is running",
  });
});
