/**
 * Mock AI responses for testing various scenarios
 */

const { POST_TYPES } = require('../../src/types');

class AIResponseMocks {
  /**
   * Valid, well-structured response
   */
  static validResponse() {
    return JSON.stringify({
      title: "AI Revolution in Tech",
      post: "Discover how artificial intelligence is transforming the tech industry. From machine learning to neural networks, explore the latest innovations! #TechTrends",
      hashtags: ["artificialintelligence", "tech", "innovation", "machinelearning", "future", "technology", "coding", "ai", "datascience", "programming"],
      type: POST_TYPES.CAROUSEL,
      visualIdea: "Split-screen carousel showing AI concepts and real-world applications"
    });
  }
  
  /**
   * Valid response with minimum requirements
   */
  static validMinimalResponse() {
    return JSON.stringify({
      title: "Tech Tips",
      post: "Quick tech tip for better coding practices.",
      hashtags: ["tech", "coding", "programming", "tips", "development", "software", "webdev", "javascript"],
      type: POST_TYPES.POST,
      visualIdea: "Simple text overlay on clean background"
    });
  }
  
  /**
   * Valid response with maximum requirements
   */
  static validMaxResponse() {
    return JSON.stringify({
      title: "Complete Guide to Modern Web Development",
      post: "This comprehensive guide covers everything you need to know about modern web development, including HTML5, CSS3, JavaScript frameworks, responsive design, performance optimization, accessibility best practices, deployment strategies, and emerging trends in the industry.",
      hashtags: ["webdevelopment", "html", "css", "javascript", "react", "vue", "angular", "nodejs", "frontend", "backend", "fullstack", "coding", "programming", "tech", "developer"],
      type: POST_TYPES.CAROUSEL,
      visualIdea: "Comprehensive multi-slide educational carousel with code examples and diagrams"
    });
  }
  
  /**
   * Malformed JSON - missing quotes
   */
  static malformedJSON() {
    return `{
      title: "Invalid JSON",
      post: "This JSON is malformed",
      hashtags: ["invalid", "json"],
      type: "post",
      visualIdea: "Error message visualization"
    }`;
  }
  
  /**
   * Incomplete JSON - missing required fields
   */
  static incompleteResponse() {
    return JSON.stringify({
      title: "Incomplete Response",
      post: "This response is missing fields"
      // Missing hashtags, type, visualIdea
    });
  }
  
  /**
   * Invalid data types
   */
  static invalidDataTypes() {
    return JSON.stringify({
      title: 123, // Should be string
      post: ["array", "instead", "of", "string"], // Should be string
      hashtags: "not-an-array", // Should be array
      type: 456, // Should be string
      visualIdea: null // Should be string
    });
  }
  
  /**
   * Title too long (more than 10 words)
   */
  static titleTooLong() {
    return JSON.stringify({
      title: "This Title Is Way Too Long And Exceeds The Maximum Word Count Limit That Has Been Set",
      post: "This post has a title that's too long.",
      hashtags: ["title", "validation", "error", "test", "example", "demo", "sample", "mock"],
      type: POST_TYPES.POST,
      visualIdea: "Error visualization for title length"
    });
  }
  
  /**
   * Not enough hashtags (less than 8)
   */
  static insufficientHashtags() {
    return JSON.stringify({
      title: "Not Enough Hashtags",
      post: "This post doesn't have enough hashtags.",
      hashtags: ["only", "few", "hashtags"],
      type: POST_TYPES.POST,
      visualIdea: "Warning icon for insufficient hashtags"
    });
  }
  
  /**
   * Too many hashtags (more than 15)
   */
  static excessiveHashtags() {
    return JSON.stringify({
      title: "Too Many Hashtags",
      post: "This post has too many hashtags.",
      hashtags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen"],
      type: POST_TYPES.POST,
      visualIdea: "Error visualization for excessive hashtags"
    });
  }
  
  /**
   * Duplicate hashtags
   */
  static duplicateHashtags() {
    return JSON.stringify({
      title: "Duplicate Hashtags",
      post: "This post has duplicate hashtags.",
      hashtags: ["tech", "coding", "tech", "programming", "coding", "development", "webdev", "javascript", "frontend", "backend"],
      type: POST_TYPES.POST,
      visualIdea: "Warning icon for duplicate hashtags"
    });
  }
  
  /**
   * Invalid post type
   */
  static invalidPostType() {
    return JSON.stringify({
      title: "Invalid Post Type",
      post: "This post has an invalid type.",
      hashtags: ["invalid", "type", "error", "test", "example", "demo", "sample", "mock"],
      type: "invalid-type",
      visualIdea: "Error visualization for invalid post type"
    });
  }
  
  /**
   * Empty strings
   */
  static emptyStrings() {
    return JSON.stringify({
      title: "",
      post: "",
      hashtags: ["", "valid", "hashtag"],
      type: POST_TYPES.POST,
      visualIdea: ""
    });
  }
  
  /**
   * Post too long (more than 500 characters)
   */
  static postTooLong() {
    const longPost = "This post is way too long and exceeds the maximum character limit that has been set for the content generation system. It contains way more than 500 characters, which is the maximum allowed length for any post content. This should trigger a validation error when the system attempts to process this response from the AI provider. The content generation service should catch this error and handle it appropriately by either rejecting the response or asking the AI to generate a shorter version of the content that meets the specified requirements and constraints.";
    
    return JSON.stringify({
      title: "Post Too Long",
      post: longPost,
      hashtags: ["long", "post", "validation", "error", "test", "example", "demo", "sample"],
      type: POST_TYPES.POST,
      visualIdea: "Error visualization for post length"
    });
  }
  
  /**
   * Plain text response (not JSON)
   */
  static plainTextResponse() {
    return "This is just plain text, not JSON at all. The AI provider might sometimes return this instead of proper JSON.";
  }
  
  /**
   * Empty response
   */
  static emptyResponse() {
    return "";
  }
  
  /**
   * Null response
   */
  static nullResponse() {
    return null;
  }
  
  /**
   * Array response (wrong type)
   */
  static arrayResponse() {
    return JSON.stringify([
      "This",
      "is",
      "an",
      "array",
      "not",
      "an",
      "object"
    ]);
  }
  
  /**
   * Response with extra fields (should be handled gracefully)
   */
  static responseWithExtraFields() {
    return JSON.stringify({
      title: "Extra Fields",
      post: "This response has extra fields.",
      hashtags: ["extra", "fields", "test", "example", "demo", "sample", "mock", "data"],
      type: POST_TYPES.POST,
      visualIdea: "Clean visualization",
      extraField1: "This should be ignored",
      extraField2: 123,
      extraField3: {
        nested: "object"
      }
    });
  }
  
  /**
   * Response with special characters
   */
  static responseWithSpecialChars() {
    return JSON.stringify({
      title: "Special Characters: @#$%^&*()",
      post: "This post contains special chars: éñüöä ß and emojis: rocket",
      hashtags: ["special", "characters", "unicode", "emoji", "test", "example", "demo", "sample"],
      type: POST_TYPES.POST,
      visualIdea: "Colorful design with special characters"
    });
  }
  
  /**
   * Get all mock responses for batch testing
   */
  static getAllMocks() {
    return {
      valid: this.validResponse(),
      minimal: this.validMinimalResponse(),
      max: this.validMaxResponse(),
      malformed: this.malformedJSON(),
      incomplete: this.incompleteResponse(),
      invalidTypes: this.invalidDataTypes(),
      titleTooLong: this.titleTooLong(),
      insufficientHashtags: this.insufficientHashtags(),
      excessiveHashtags: this.excessiveHashtags(),
      duplicateHashtags: this.duplicateHashtags(),
      invalidType: this.invalidPostType(),
      emptyStrings: this.emptyStrings(),
      postTooLong: this.postTooLong(),
      plainText: this.plainTextResponse(),
      empty: this.emptyResponse(),
      null: this.nullResponse(),
      array: this.arrayResponse(),
      extraFields: this.responseWithExtraFields(),
      specialChars: this.responseWithSpecialChars()
    };
  }
}

module.exports = AIResponseMocks;
