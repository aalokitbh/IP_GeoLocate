const {
  getGeolocation,
  GeolocationError,
} = require("../services/geolocation.service");

const { isValidIp } = require("../utils/ipValidator");

async function geolocate(req, res) {
  const { ip } = req.query;

  if (!isValidIp(ip)) {
    return res.status(400).json({
      success: false,
      error: {
        message: "A valid IPv4 or IPv6 address is required",
      },
    });
  }

  try {
    const result = await getGeolocation(ip);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Geolocation lookup failed:", error);

    if (error instanceof GeolocationError) {
      const messages = {
        UPSTREAM_TIMEOUT: "Geolocation provider timed out",
        UPSTREAM_HTTP_ERROR: "Geolocation provider request failed",
        UPSTREAM_CONNECTION_ERROR:
          "Unable to reach geolocation provider",
        UPSTREAM_INVALID_RESPONSE:
          "Geolocation provider returned an invalid response",
        UPSTREAM_LOOKUP_FAILED:
          "Geolocation lookup failed",
      };

      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message:
            messages[error.code] ||
            "Geolocation provider request failed",
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
      },
    });
  }
}

module.exports = { geolocate };
