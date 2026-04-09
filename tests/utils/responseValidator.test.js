/**
 * Tests for the ResponseValidator utility
 */

const ResponseValidator = require('./responseValidator');
const { POST_TYPES } = require('../../src/types');

describe('ResponseValidator Utility Tests', () => {
  describe('validateApiResponse', () => {
    test('should validate correct API response', () => {
      const response = {
        success: true,
        data: {
          title: "Test Title",
          post: "Test post content",
          hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
          type: POST_TYPES.POST,
          visualIdea: "Test visual idea"
        },
        metadata: {
          generatedAt: "2024-01-15T10:30:00.000Z",
          processingTime: 1250
        }
      };
      
      const result = ResponseValidator.validateApiResponse(response);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject response without success field', () => {
      const response = {
        data: {
          title: "Test Title",
          post: "Test post",
          hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
          type: POST_TYPES.POST,
          visualIdea: "Test visual"
        }
      };
      
      const result = ResponseValidator.validateApiResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Response must have a boolean success field');
    });
    
    test('should reject response without data field', () => {
      const response = {
        success: true
      };
      
      const result = ResponseValidator.validateApiResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Response must have a data object');
    });
    
    test('should handle response with invalid data', () => {
      const response = {
        success: true,
        data: {
          title: "", // Invalid: empty
          post: "Test post",
          hashtags: ["only", "few"], // Invalid: not enough
          type: "invalid-type", // Invalid: not supported
          visualIdea: "Test visual"
        }
      };
      
      const result = ResponseValidator.validateApiResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    test('should handle response with invalid metadata', () => {
      const response = {
        success: true,
        data: {
          title: "Test Title",
          post: "Test post",
          hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
          type: POST_TYPES.POST,
          visualIdea: "Test visual"
        },
        metadata: {
          generatedAt: 123, // Invalid: should be string
          processingTime: -500 // Invalid: should be positive
        }
      };
      
      const result = ResponseValidator.validateApiResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GeneratedAt must be a string');
      expect(result.errors).toContain('ProcessingTime must be a positive number');
    });
  });
  
  describe('validateContentData', () => {
    test('should validate correct content data', () => {
      const data = {
        title: "Test Title",
        post: "Test post content",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual idea"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject missing title', () => {
      const data = {
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title must be a non-empty string');
    });
    
    test('should reject empty title', () => {
      const data = {
        title: "",
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title cannot be empty');
    });
    
    test('should reject title that is too long', () => {
      const data = {
        title: "This Title Is Way Too Long And Exceeds The Maximum Word Count",
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title must be 10 words or less');
    });
    
    test('should reject missing post', () => {
      const data = {
        title: "Test Title",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Post must be a non-empty string');
    });
    
    test('should reject post that is too long', () => {
      const longPost = "x".repeat(501);
      const data = {
        title: "Test Title",
        post: longPost,
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Post must be 500 characters or less');
    });
    
    test('should reject non-array hashtags', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: "not-an-array",
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hashtags must be an array');
    });
    
    test('should reject insufficient hashtags', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["only", "few"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hashtags must be between 8 and 15 items');
    });
    
    test('should reject excessive hashtags', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: Array(20).fill().map((_, i) => `tag${i}`),
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hashtags must be between 8 and 15 items');
    });
    
    test('should reject non-string hashtags', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["string", 123, true, null, undefined, "another", "string", "final"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All hashtags must be strings');
    });
    
    test('should reject empty hashtags', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["valid", "", "another", "valid", "valid", "valid", "valid", "valid"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hashtags cannot be empty');
    });
    
    test('should reject duplicate hashtags', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["duplicate", "duplicate", "unique", "unique", "unique", "unique", "unique", "unique"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hashtags must be unique (case-insensitive)');
    });
    
    test('should reject duplicate hashtags with different cases', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["Test", "test", "TEST", "unique", "unique", "unique", "unique", "unique"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hashtags must be unique (case-insensitive)');
    });
    
    test('should reject invalid post type', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: "invalid-type",
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Type must be one of: ${Object.values(POST_TYPES).join(', ')}`);
    });
    
    test('should reject missing visual idea', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Visual idea must be a non-empty string');
    });
    
    test('should reject empty visual idea', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: ""
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Visual idea cannot be empty');
    });
  });
  
  describe('validateErrorResponse', () => {
    test('should validate correct error response', () => {
      const response = {
        success: false,
        error: "Validation failed",
        details: [
          {
            field: "topic",
            message: "Topic is required",
            value: ""
          }
        ]
      };
      
      const result = ResponseValidator.validateErrorResponse(response);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject response with success: true', () => {
      const response = {
        success: true,
        error: "Some error"
      };
      
      const result = ResponseValidator.validateErrorResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Error response must have success: false');
    });
    
    test('should reject response without error message', () => {
      const response = {
        success: false
      };
      
      const result = ResponseValidator.validateErrorResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Error response must have an error message');
    });
    
    test('should reject response with non-string error', () => {
      const response = {
        success: false,
        error: 123
      };
      
      const result = ResponseValidator.validateErrorResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Error response must have an error message');
    });
    
    test('should reject response with non-array details', () => {
      const response = {
        success: false,
        error: "Validation failed",
        details: "not-an-array"
      };
      
      const result = ResponseValidator.validateErrorResponse(response);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Error details must be an array');
    });
  });
  
  describe('validateRequestPayload', () => {
    test('should validate correct request payload', () => {
      const payload = {
        topic: "machine learning",
        platform: "instagram",
        tone: "casual"
      };
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject empty topic', () => {
      const payload = {
        topic: "",
        platform: "instagram",
        tone: "casual"
      };
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Topic must be at least 3 characters');
    });
    
    test('should reject topic that is too short', () => {
      const payload = {
        topic: "AI",
        platform: "instagram",
        tone: "casual"
      };
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Topic must be at least 3 characters');
    });
    
    test('should reject topic that is too long', () => {
      const payload = {
        topic: "x".repeat(201),
        platform: "instagram",
        tone: "casual"
      };
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Topic must be 200 characters or less');
    });
    
    test('should reject invalid platform', () => {
      const payload = {
        topic: "machine learning",
        platform: "facebook",
        tone: "casual"
      };
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Platform must be one of: instagram, linkedin, tiktok');
    });
    
    test('should reject invalid tone', () => {
      const payload = {
        topic: "machine learning",
        platform: "instagram",
        tone: "funny"
      };
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tone must be one of: casual, professional, motivational');
    });
    
    test('should reject non-object payload', () => {
      const payload = "not-an-object";
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Payload must be an object');
    });
    
    test('should reject null payload', () => {
      const payload = null;
      
      const result = ResponseValidator.validateRequestPayload(payload);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Payload must be an object');
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle whitespace-only strings', () => {
      const data = {
        title: "   ",
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title cannot be empty');
    });
    
    test('should handle hashtags with whitespace', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["  valid  ", "  another  ", "  hashtag  ", "  test  ", "  case  ", "  edge  ", "  validation  ", "  final  "],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should handle title with exactly 10 words', () => {
      const data = {
        title: "One Two Three Four Five Six Seven Eight Nine Ten",
        post: "Test post",
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should handle post with exactly 500 characters', () => {
      const post = "x".repeat(500);
      const data = {
        title: "Test Title",
        post: post,
        hashtags: ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should handle hashtags with exactly 8 items', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: ["1", "2", "3", "4", "5", "6", "7", "8"],
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should handle hashtags with exactly 15 items', () => {
      const data = {
        title: "Test Title",
        post: "Test post",
        hashtags: Array(15).fill().map((_, i) => `${i + 1}`),
        type: POST_TYPES.POST,
        visualIdea: "Test visual"
      };
      
      const result = ResponseValidator.validateContentData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
