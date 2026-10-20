
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

test("geolocation rate limiter blocks requests exceeding the limit", async (t) => {
  const previousLimit = process.env.GEOLOCATION_RATE_LIMIT_MAX;
  process.env.GEOLOCATION_RATE_LIMIT_MAX = "2";

  // Load the router after setting the environment variable.
  const routerPath = require.resolve("../src/routes/geolocation.routes");
  delete require.cache[routerPath];
  const geolocationRoutes = require("../src/routes/geolocation.routes");

  const app = express();
  app.use("/api/geolocate", geolocationRoutes);
  app.get("/health", (req, res) => {
    res.status(200).json({ success: true });
  });

  const server = app.listen(0);

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    delete require.cache[routerPath];

    if (previousLimit === undefined) {
      delete process.env.GEOLOCATION_RATE_LIMIT_MAX;
    } else {
      process.env.GEOLOCATION_RATE_LIMIT_MAX = previousLimit;
    }
  });

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const first = await fetch(`${baseUrl}/api/geolocate?ip=invalid`);
  const second = await fetch(`${baseUrl}/api/geolocate?ip=invalid`);
  const third = await fetch(`${baseUrl}/api/geolocate?ip=invalid`);

  assert.equal(first.status, 400);
  assert.equal(second.status, 400);
  assert.equal(third.status, 429);

  const body = await third.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "RATE_LIMIT_EXCEEDED");

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
});
