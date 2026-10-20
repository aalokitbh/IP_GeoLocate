const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");

const {
  getGeolocation,
  GeolocationError,
} = require("../src/services/geolocation.service");

test("provider timeout produces a 504 GeolocationError", async () => {
  const originalGet = axios.get;

  axios.get = async () => {
    const error = new Error("timeout");
    error.code = "ECONNABORTED";
    throw error;
  };

  try {
    await assert.rejects(
      getGeolocation("8.8.8.8"),
      (error) => {
        assert.ok(error instanceof GeolocationError);
        assert.equal(error.code, "UPSTREAM_TIMEOUT");
        assert.equal(error.statusCode, 504);
        return true;
      }
    );
  } finally {
    axios.get = originalGet;
  }
});


test("provider connection failure produces a 502 GeolocationError", async () => {
  const originalGet = axios.get;

  axios.get = async () => {
    const error = new Error("Network Error");
    error.request = {};
    throw error;
  };

  try {
    await assert.rejects(
      getGeolocation("8.8.8.8"),
      (error) => {
        assert.ok(error instanceof GeolocationError);
        assert.equal(error.code, "UPSTREAM_CONNECTION_ERROR");
        assert.equal(error.statusCode, 502);
        return true;
      }
    );
  } finally {
    axios.get = originalGet;
  }
});


test("unsuccessful provider lookup produces a 502 GeolocationError", async () => {
  const originalGet = axios.get;

  axios.get = async () => ({
    status: 200,
    data: {
      status: "fail",
      message: "private range",
      query: "192.168.1.1",
    },
  });

  try {
    await assert.rejects(
      getGeolocation("192.168.1.1"),
      (error) => {
        assert.ok(error instanceof GeolocationError);
        assert.equal(error.code, "UPSTREAM_LOOKUP_FAILED");
        assert.equal(error.statusCode, 502);
        assert.equal(error.message, "private range");
        return true;
      }
    );
  } finally {
    axios.get = originalGet;
  }
});


test("provider HTTP error produces a 502 GeolocationError", async () => {
  const originalGet = axios.get;

  axios.get = async () => {
    const error = new Error("Request failed with status code 503");
    error.response = {
      status: 503,
      data: { message: "Service unavailable" },
    };
    throw error;
  };

  try {
    await assert.rejects(
      getGeolocation("8.8.8.8"),
      (error) => {
        assert.ok(error instanceof GeolocationError);
        assert.equal(error.code, "UPSTREAM_HTTP_ERROR");
        assert.equal(error.statusCode, 502);
        return true;
      }
    );
  } finally {
    axios.get = originalGet;
  }
});
