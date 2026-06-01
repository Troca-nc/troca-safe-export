'use strict';

const {
  blacklistAccessToken,
  blacklistRefreshToken,
  isAccessTokenBlacklisted,
  isRefreshTokenBlacklisted,
} = require('./authAccountService');

module.exports = {
  addToTokenBlacklist: blacklistAccessToken,
  blacklistAccessToken,
  blacklistRefreshToken,
  isAccessTokenBlacklisted,
  isTokenBlacklisted: isAccessTokenBlacklisted,
  isRefreshTokenBlacklisted,
};
