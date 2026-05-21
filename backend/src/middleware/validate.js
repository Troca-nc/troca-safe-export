'use strict';

const Joi = require('joi');

const DEFAULT_OPTIONS = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};

const validatePart = (schema, value) => {
  if (!schema) return { value, error: null };
  return schema.validate(value, DEFAULT_OPTIONS);
};

const validate = (schema = {}) => {
  return (req, res, next) => {
    const bodyResult = validatePart(schema.body, req.body);
    const paramsResult = validatePart(schema.params, req.params);
    const queryResult = validatePart(schema.query, req.query);

    const errors = [
      ...(bodyResult.error?.details || []),
      ...(paramsResult.error?.details || []),
      ...(queryResult.error?.details || []),
    ];

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Payload invalide',
        code: 'VALIDATION_ERROR',
        details: errors.map((d) => d.message),
      });
    }

    req.body = bodyResult.value;
    req.params = paramsResult.value;
    req.query = queryResult.value;
    return next();
  };
};

module.exports = { validate, Joi };
