/**
 * Configuration management
 * Uses centralized environment configuration
 */

const { config, validation } = require('./env');

// Export configuration for backward compatibility
module.exports = {
  ...config.groq,
  ...config.server,
  ...config.limits,
  ...config.logging,
  
  // Legacy exports for backward compatibility
  GROQ_API_KEY: config.groq.apiKey,
  GROQ_MODEL: config.groq.model,
  GROQ_MAX_TOKENS: config.groq.maxTokens,
  GROQ_TEMPERATURE: config.groq.temperature,
  PORT: config.server.port,
  NODE_ENV: config.server.nodeEnv,
  ALLOWED_ORIGINS: config.server.allowedOrigins,
  MAX_TITLE_WORDS: config.limits.maxTitleWords,
  MIN_HASHTAGS: config.limits.minHashtags,
  MAX_HASHTAGS: config.limits.maxHashtags,
  MAX_POST_LENGTH: config.limits.maxPostLength,
  LOG_LEVEL: config.logging.level,
  
  // Export validation helpers
  validation
};
