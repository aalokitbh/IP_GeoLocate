const { getGeolocation } = require("../services/geolocation.service");
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
    console.error("Geolocation lookup failed:", error.message);

    // The external provider returned an unsuccessful lookup.
    if (error.statusCode === 502) {
      return res.status(502).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    }

    // The provider timed out or could not be reached.
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return res.status(504).json({
        success: false,
        error: {
          message: "Geolocation provider timed out",
        },
      });
    }

    if (error.response) {
      return res.status(502).json({
        success: false,
        error: {
          message: "Geolocation provider request failed",
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
