/**
 * Request validation middleware using Joi
 */

const Joi = require('joi');
const { PLATFORMS, TONES } = require('../types');

// Content generation request schema
const contentGenerationSchema = Joi.object({
  topic: Joi.string()
    .required()
    .min(3)
    .max(200)
    .trim()
    .messages({
      'string.empty': 'Topic cannot be empty',
      'string.min': 'Topic must be at least 3 characters long',
      'string.max': 'Topic cannot exceed 200 characters',
      'any.required': 'Topic is required'
    }),
  
  platform: Joi.string()
    .required()
    .valid(...Object.values(PLATFORMS))
    .messages({
      'any.only': `Platform must be one of: ${Object.values(PLATFORMS).join(', ')}`,
      'any.required': 'Platform is required'
    }),
  
  tone: Joi.string()
    .required()
    .valid(...Object.values(TONES))
    .messages({
      'any.only': `Tone must be one of: ${Object.values(TONES).join(', ')}`,
      'any.required': 'Tone is required'
    })
});

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema to validate against
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} - Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Content generation validation middleware
 */
const validateContentGeneration = validate(contentGenerationSchema);

module.exports = {
  validate,
  validateContentGeneration,
  contentGenerationSchema
};
