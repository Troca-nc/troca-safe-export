'use strict';

const { v4: uuidv4 } = require('uuid');

function requestContext(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const requestId = typeof incoming === 'string' && incoming.trim()
    ? incoming.trim().slice(0, 80)
    : uuidv4();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

module.exports = { requestContext };
