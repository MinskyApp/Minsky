/**
 * Response validation utilities for testing
 */

const { PLATFORMS, TONES, POST_TYPES } = require('../../src/types');

class ResponseValidator {
  /**
   * Validate complete API response structure
   */
  static validateApiResponse(response) {
    const errors = [];
    
    // Check top-level structure
    if (!response || typeof response !== 'object') {
      errors.push('Response must be an object');
      return { isValid: false, errors };
    }
    
    // Check success field
    if (typeof response.success !== 'boolean') {
      errors.push('Response must have a boolean success field');
    }
    
    // Check data field
    if (!response.data || typeof response.data !== 'object') {
      errors.push('Response must have a data object');
      return { isValid: false, errors };
    }
    
    // Validate content data
    const contentValidation = this.validateContentData(response.data);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
    }
    
    // Check metadata if present
    if (response.metadata) {
      const metadataValidation = this.validateMetadata(response.metadata);
      if (!metadataValidation.isValid) {
        errors.push(...metadataValidation.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate content data structure
   */
  static validateContentData(data) {
    const errors = [];
    
    // Title validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title must be a non-empty string');
    } else if (data.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    } else if (data.title.split(' ').length > 10) {
      errors.push('Title must be 10 words or less');
    }
    
    // Post validation
    if (!data.post || typeof data.post !== 'string') {
      errors.push('Post must be a non-empty string');
    } else if (data.post.trim().length === 0) {
      errors.push('Post cannot be empty');
    } else if (data.post.length > 500) {
      errors.push('Post must be 500 characters or less');
    }
    
    // Hashtags validation
    if (!Array.isArray(data.hashtags)) {
      errors.push('Hashtags must be an array');
    } else {
      if (data.hashtags.length < 8 || data.hashtags.length > 15) {
        errors.push('Hashtags must be between 8 and 15 items');
      }
      
      // Check for non-string hashtags
      const nonStringHashtags = data.hashtags.filter(tag => typeof tag !== 'string');
      if (nonStringHashtags.length > 0) {
        errors.push('All hashtags must be strings');
      }
      
      // Check for empty hashtags
      const emptyHashtags = data.hashtags.filter(tag => !tag || tag.trim().length === 0);
      if (emptyHashtags.length > 0) {
        errors.push('Hashtags cannot be empty');
      }
      
      // Check for duplicates
      const normalizedHashtags = data.hashtags.map(tag => tag.toLowerCase().trim());
      const uniqueHashtags = [...new Set(normalizedHashtags)];
      if (uniqueHashtags.length !== normalizedHashtags.length) {
        errors.push('Hashtags must be unique (case-insensitive)');
      }
    }
    
    // Type validation
    if (!data.type || typeof data.type !== 'string') {
      errors.push('Type must be a non-empty string');
    } else if (!Object.values(POST_TYPES).includes(data.type)) {
      errors.push(`Type must be one of: ${Object.values(POST_TYPES).join(', ')}`);
    }
    
    // Visual idea validation
    if (!data.visualIdea || typeof data.visualIdea !== 'string') {
      errors.push('Visual idea must be a non-empty string');
    } else if (data.visualIdea.trim().length === 0) {
      errors.push('Visual idea cannot be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate metadata structure
   */
  static validateMetadata(metadata) {
    const errors = [];
    
    if (typeof metadata !== 'object') {
      errors.push('Metadata must be an object');
      return { isValid: false, errors };
    }
    
    // Check generatedAt if present
    if (metadata.generatedAt && typeof metadata.generatedAt !== 'string') {
      errors.push('GeneratedAt must be a string');
    }
    
    // Check processingTime if present
    if (metadata.processingTime !== undefined) {
      if (typeof metadata.processingTime !== 'number' || metadata.processingTime < 0) {
        errors.push('ProcessingTime must be a positive number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate error response structure
   */
  static validateErrorResponse(response) {
    const errors = [];
    
    if (!response || typeof response !== 'object') {
      errors.push('Error response must be an object');
      return { isValid: false, errors };
    }
    
    if (response.success !== false) {
      errors.push('Error response must have success: false');
    }
    
    if (!response.error || typeof response.error !== 'string') {
      errors.push('Error response must have an error message');
    }
    
    // Check for details in validation errors
    if (response.details && !Array.isArray(response.details)) {
      errors.push('Error details must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate request payload
   */
  static validateRequestPayload(payload) {
    const errors = [];
    
    if (!payload || typeof payload !== 'object') {
      errors.push('Payload must be an object');
      return { isValid: false, errors };
    }
    
    // Topic validation
    if (!payload.topic || typeof payload.topic !== 'string') {
      errors.push('Topic must be a non-empty string');
    } else if (payload.topic.trim().length < 3) {
      errors.push('Topic must be at least 3 characters');
    } else if (payload.topic.length > 200) {
      errors.push('Topic must be 200 characters or less');
    }
    
    // Platform validation
    if (!payload.platform || typeof payload.platform !== 'string') {
      errors.push('Platform must be a non-empty string');
    } else if (!Object.values(PLATFORMS).includes(payload.platform)) {
      errors.push(`Platform must be one of: ${Object.values(PLATFORMS).join(', ')}`);
    }
    
    // Tone validation
    if (!payload.tone || typeof payload.tone !== 'string') {
      errors.push('Tone must be a non-empty string');
    } else if (!Object.values(TONES).includes(payload.tone)) {
      errors.push(`Tone must be one of: ${Object.values(TONES).join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ResponseValidator;
