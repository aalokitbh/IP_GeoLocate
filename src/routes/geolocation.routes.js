
const express = require("express");
const { geolocate } = require("../controllers/geolocation.controller");

const router = express.Router();

router.get("/", geolocate);

module.exports = router;
