# IPLocate API

IPLocate is a Node.js/Express REST API that validates an IP address and returns geolocation metadata for it using the `ip-api.com` provider.

## Features

- IPv4 and IPv6 query validation
- IP geolocation lookup endpoint
- Health check endpoint
- Geolocation endpoint rate limiting
- Structured upstream and runtime error handling
- Automated tests using Node's built-in test runner

## Tech Stack

- Node.js
- Express
- Axios
- express-rate-limit
- dotenv

## Project Structure

```text
/home/runner/work/IP_GeoLocate/IP_GeoLocate
├── src/
│   ├── server.js                         # App bootstrap, /health route, route mounting
│   ├── routes/geolocation.routes.js      # /api/geolocate route + rate limiter
│   ├── controllers/geolocation.controller.js # Request validation + response mapping
│   ├── services/geolocation.service.js   # External provider call + error normalization
│   └── utils/ipValidator.js              # IPv4/IPv6 validation helper
├── tests/
│   ├── geolocation.service.test.js       # Service-level upstream error behavior tests
│   └── geolocation.rate-limit.test.js    # Geolocation endpoint rate limiting behavior test
├── package.json
└── README.md
```

## Request Flow

1. `GET /api/geolocate?ip=...` enters `src/routes/geolocation.routes.js`.
2. The geolocation rate limiter runs first.
3. The controller (`geolocate`) validates `ip` using `isValidIp`.
4. If valid, controller calls `getGeolocation(ip)` in the service.
5. The service requests `http://ip-api.com/json/{ip}` with selected fields and timeout.
6. The controller maps success/error results to HTTP responses.

## Installation and Setup

### Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm

### Install

```bash
git clone https://github.com/aalokitbh/IP_GeoLocate.git
cd IP_GeoLocate
npm install
```

### Environment Variables

Create a `.env` file in the repository root (optional):

```env
PORT=3000
GEOLOCATION_RATE_LIMIT_MAX=100
```

- `PORT` (default: `3000`): API server port.
- `GEOLOCATION_RATE_LIMIT_MAX` (default: `100`): max requests per IP per rate-limit window for `/api/geolocate`.

### Run the Server

Development mode (watch):

```bash
npm run dev
```

Normal mode:

```bash
npm start
```

Base URL (default): `http://localhost:3000`

## API Reference

### `GET /health`

Health endpoint to confirm server availability.

#### Example

```bash
curl -i http://localhost:3000/health
```

#### Success Response (`200`)

```json
{
  "success": true,
  "message": "IPLocate API is running"
}
```

---

### `GET /api/geolocate`

Looks up geolocation metadata for a single IP address.

#### Query Parameters

- `ip` (required, string): valid IPv4 or IPv6 address.

#### Example Request

```bash
curl -i "http://localhost:3000/api/geolocate?ip=8.8.8.8"
```

#### Success Response (`200`)

```json
{
  "success": true,
  "data": {
    "ip": "8.8.8.8",
    "city": "Mountain View",
    "region": "California",
    "country": "United States",
    "countryCode": "US",
    "timezone": "America/Los_Angeles",
    "isp": "Google LLC",
    "coordinates": {
      "latitude": 37.4056,
      "longitude": -122.0775
    }
  }
}
```

## IP Validation and Geolocation Provider Behavior

### Supported Validation

- IPv4 and IPv6 are both supported.
- Validation is implemented with Node's `net.isIP()` in `src/utils/ipValidator.js`.
- Invalid/missing values return `400`.

#### Invalid IP Example (`400`)

```bash
curl -i "http://localhost:3000/api/geolocate?ip=invalid-ip"
```

```json
{
  "success": false,
  "error": {
    "message": "A valid IPv4 or IPv6 address is required"
  }
}
```

### External Provider Integration

- Service calls: `http://ip-api.com/json/{encodedIp}`
- Selected fields requested:
  - `status,message,query,city,regionName,country,countryCode,timezone,isp,lat,lon`
- Request timeout: `5000ms`

### Upstream Failure/Timeout Handling

- Timeout/network timeout -> `504` with `UPSTREAM_TIMEOUT`
- Upstream HTTP response errors -> `502` with `UPSTREAM_HTTP_ERROR`
- Connection failures (no response) -> `502` with `UPSTREAM_CONNECTION_ERROR`
- Invalid upstream payload shape -> `502` with `UPSTREAM_INVALID_RESPONSE`
- Upstream lookup failures (`status !== "success"`) -> `502` with `UPSTREAM_LOOKUP_FAILED`

## Rate Limiting

Rate limiting is applied only to `GET /api/geolocate`.

- Default window: **15 minutes**
- Default max requests per window: **100** per IP
- Configurable max: `GEOLOCATION_RATE_LIMIT_MAX`
- `/health` is **not** subject to this geolocation limiter

### Rate-Limit Exceeded Example (`429`)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

## Error Handling

### Error Response Shape

- Validation/internal errors:

```json
{
  "success": false,
  "error": {
    "message": "..."
  }
}
```

- Geolocation upstream/rate-limit errors include an error code:

```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "..."
  }
}
```

### Status Codes and Error Codes

| HTTP Status | `error.code` (if present) | Meaning |
|---|---|---|
| `200` | _n/a_ | Request succeeded |
| `400` | _none_ | Invalid or missing `ip` query parameter |
| `429` | `RATE_LIMIT_EXCEEDED` | Geolocation endpoint rate limit exceeded |
| `502` | `UPSTREAM_HTTP_ERROR` | Provider returned HTTP error |
| `502` | `UPSTREAM_CONNECTION_ERROR` | Provider unreachable/no response |
| `502` | `UPSTREAM_INVALID_RESPONSE` | Provider returned invalid payload |
| `502` | `UPSTREAM_LOOKUP_FAILED` | Provider returned lookup failure |
| `504` | `UPSTREAM_TIMEOUT` | Provider timeout |
| `500` | _none_ | Unexpected internal server error |

## Testing

### Run Tests

```bash
npm test
```

### What the Current Tests Cover

- `tests/geolocation.service.test.js`
  - Timeout mapping to `UPSTREAM_TIMEOUT`/`504`
  - Connection failure mapping to `UPSTREAM_CONNECTION_ERROR`/`502`
  - Provider HTTP error mapping to `UPSTREAM_HTTP_ERROR`/`502`
  - Provider lookup failure mapping to `UPSTREAM_LOOKUP_FAILED`/`502`
- `tests/geolocation.rate-limit.test.js`
  - Geolocation endpoint is limited
  - `429` response payload for exceeded limit
  - `/health` endpoint remains accessible

### Test Prerequisites

- Install dependencies with `npm install`
- No separate external service setup is required for existing automated tests
