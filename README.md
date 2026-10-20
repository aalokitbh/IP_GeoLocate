# IPLocate

A REST API that retrieves geolocation metadata for IP addresses.

## Tech Stack

- Node.js
- Express
- Axios

## Status

Under development.

## Rate Limiting

The `GET /api/geolocate` endpoint is protected with `express-rate-limit`.

- Default window: `15 minutes` (`900000` ms)
- Default limit: `100` requests per IP per window

You can override these values with environment variables:

- `GEOLOCATION_RATE_LIMIT_WINDOW_MS`
- `GEOLOCATION_RATE_LIMIT_MAX`
