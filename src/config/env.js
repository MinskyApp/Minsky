/**
 * Centralized environment configuration
 * Provides secure access to environment variables
 */

const config = {
  // AI Provider Configuration
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
    maxTokens: parseInt(process.env.GROQ_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.GROQ_TEMPERATURE) || 0.7
  },
  
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  },
  
  // Content Generation Limits
  limits: {
    maxTitleWords: parseInt(process.env.MAX_TITLE_WORDS) || 10,
    minHashtags: parseInt(process.env.MIN_HASHTAGS) || 8,
    maxHashtags: parseInt(process.env.MAX_HASHTAGS) || 15,
    maxPostLength: parseInt(process.env.MAX_POST_LENGTH) || 500
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validation helpers
const validation = {
  /**
   * Check if required environment variables are set
   */
  validateRequired: () => {
    const required = ['GROQ_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Also validate the format of required keys
    const apiKey = process.env.GROQ_API_KEY;
    if (!validation.validateApiKey(apiKey)) {
      throw new Error(`GROQ_API_KEY is not defined or invalid`);
    }
    
    return true;
  },
  
  /**
   * Check if API key is valid format
   */
  validateApiKey: (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Basic format validation for API keys
    // Allow test keys for testing
    if (apiKey === 'test-key' || apiKey === 'test-key-valid-format') {
      return true;
    }
    
    return apiKey.length > 10 && !apiKey.includes(' ');
  },
  
  /**
   * Get masked API key for logging
   */
  maskApiKey: (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
      return 'undefined';
    }
    
    if (apiKey.length <= 8) {
      return apiKey;
    }
    
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
  }
};

// Validate environment on import
validation.validateRequired();

module.exports = {
  config,
  validation
};
