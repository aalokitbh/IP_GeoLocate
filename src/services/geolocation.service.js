
const axios = require("axios");

const GEOLOCATION_API_URL = "http://ip-api.com/json";

async function getGeolocation(ip) {
  const response = await axios.get(
    `${GEOLOCATION_API_URL}/${encodeURIComponent(ip)}`,
    {
      params: {
        fields:
          "status,message,query,city,regionName,country,countryCode,timezone,isp,lat,lon",
      },
      timeout: 5000,
    }
  );

  const data = response.data;

  if (data.status !== "success") {
    const error = new Error(
      data.message || "Geolocation lookup failed"
    );
    error.statusCode = 502;
    throw error;
  }

  return {
    ip: data.query,
    city: data.city,
    region: data.regionName,
    country: data.country,
    countryCode: data.countryCode,
    timezone: data.timezone,
    isp: data.isp,
    coordinates: {
      latitude: data.lat,
      longitude: data.lon,
    },
  };
}

module.exports = { getGeolocation };
