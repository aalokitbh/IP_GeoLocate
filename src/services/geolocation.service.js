
const axios = require("axios");

const GEOLOCATION_API_URL = "http://ip-api.com/json";
const REQUEST_TIMEOUT_MS = 5000;

class GeolocationError extends Error {
    constructor(message , code , statusCode){
        super(message);
        this.name = 'GeolocationError';
        this.code = code;
        this.statusCode = statusCode;   
    }
}

async function getGeolocation(ip) {
    let response ;
    try {
        response = await axios.get(`${GEOLOCATION_API_URL}/${encodeURIComponent(ip)}`,
        {
            params: {
                fields:
                   "status,message,query,city,regionName,country,countryCode,timezone,isp,lat,lon",
            },
            timeout: REQUEST_TIMEOUT_MS,
        }
        );
    } catch (error) {
        if(
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT'
        ){
            throw new GeolocationError(
                "Geolocation provider Timeout",
                "UPSTREAM_TIMEOUT",
                504
            );
        }

        if(error.response){
            throw new GeolocationError(
                "Geolocation Provider return an HTTP error",
                "UPSTREAM_HTTP_ERROR",
                502 
            );
        }

        if(error.request){
            throw new GeolocationError(
               "Unable to reach geolocation provider",
               "UPSTREAM_CONNECTION_ERROR",
               502
            );
        }
        throw error; 
    }

    const data = response.data;
    if(!data || typeof data !== "object" || Array.isArray(data)){
        throw new GeolocationError(
            "Geolocation provider returned invalid data",
            "UPSTREAM_INVALID_RESPONSE",
            502
        );  
    }
    if (data.status !== "success") {
        throw new GeolocationError(
            data.message || "Geolocation lookup failed",
            "UPSTREAM_LOOKUP_FAILED",
            502
        );
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

module.exports = { 
    getGeolocation , 
    GeolocationError
};
