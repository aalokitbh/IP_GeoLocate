const { isIP } = require("node:net");

function isValidIp(ip) {
  return typeof ip === "string" && isIP(ip) !== 0;
}

module.exports = { isValidIp };
