/**
 * Groq AI Provider Service
 * Handles communication with Groq API
 */

const Groq = require('groq-sdk');
const config = require('../config');
const logger = require('../utils/logger');

class GroqProvider {
  constructor() {
    if (!config.validation.validateApiKey(config.GROQ_API_KEY)) {
      throw new Error('GROQ_API_KEY is not defined or invalid');
    }
    
    this.client = new Groq({
      apiKey: config.GROQ_API_KEY
    });
    this.model = config.GROQ_MODEL;
    this.maxTokens = config.GROQ_MAX_TOKENS;
    this.temperature = config.GROQ_TEMPERATURE;
  }

  /**
   * Generate content using Groq
   * @param {string} prompt - The prompt to send to Groq
   * @returns {Promise<string>} - Generated response
   */
  async generateContent(prompt) {
    try {
      logger.info('Sending request to Groq', { model: this.model, maxTokens: this.maxTokens });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator for a tech education brand. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Groq');
      }

      logger.info('Successfully received response from Groq', { 
        contentLength: content.length,
        usage: response.usage
      });

      return content;
    } catch (error) {
      logger.error('Groq API error', { 
        error: error.message,
        status: error.status,
        code: error.code
      });
      
      // Re-throw with more descriptive message
      throw new Error(`AI Provider Error: ${error.message}`);
    }
  }

  /**
   * Health check for the provider
   * @returns {Promise<boolean>} - Whether the provider is healthy
   */
  async healthCheck() {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error('Groq health check failed', { error: error.message });
      return false;
    }
  }
}

module.exports = GroqProvider;
