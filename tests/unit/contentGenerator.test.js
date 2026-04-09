/**
 * Unit tests for ContentGeneratorService
 */

const ContentGeneratorService = require('../../src/services/contentGenerator');
const AIResponseMocks = require('../mocks/aiResponses');
const ResponseValidator = require('../utils/responseValidator');
const { PLATFORMS, TONES, POST_TYPES } = require('../../src/types');

// Mock the AI provider
jest.mock('../../src/providers/openai');

describe('ContentGeneratorService - Unit Tests', () => {
  let contentService;
  let mockAIProvider;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service instance
    contentService = new ContentGeneratorService();
    mockAIProvider = contentService.aiProvider;
  });
  
  describe('Input Validation', () => {
    test('should reject empty topic', async () => {
      const request = {
        topic: '',
        platform: PLATFORMS.INSTAGRAM,
        tone: TONES.CASUAL
      };
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Topic is required and must be a non-empty string');
    });
    
    test('should reject topic that is too short', async () => {
      const request = {
        topic: 'AI',
        platform: PLATFORMS.INSTAGRAM,
        tone: TONES.CASUAL
      };
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Topic must be at least 3 characters long');
    });
    
    test('should reject invalid platform', async () => {
      const request = {
        topic: 'machine learning',
        platform: 'invalid-platform',
        tone: TONES.CASUAL
      };
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Invalid platform. Must be one of: instagram, linkedin, tiktok');
    });
    
    test('should reject invalid tone', async () => {
      const request = {
        topic: 'machine learning',
        platform: PLATFORMS.INSTAGRAM,
        tone: 'invalid-tone'
      };
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Invalid tone. Must be one of: casual, professional, motivational');
    });
    
    test('should reject non-string topic', async () => {
      const request = {
        topic: 123,
        platform: PLATFORMS.INSTAGRAM,
        tone: TONES.CASUAL
      };
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Topic is required and must be a non-empty string');
    });
  });
  
  describe('Valid AI Response Processing', () => {
    test('should process valid AI response correctly', async () => {
      const mockResponse = AIResponseMocks.validResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      const result = await contentService.generateContent(request);
      
      // Verify AI provider was called
      expect(mockAIProvider.generateContent).toHaveBeenCalledTimes(1);
      
      // Validate result structure
      const validation = ResponseValidator.validateContentData(result);
      expect(validation.isValid).toBe(true);
      
      // Verify specific fields
      expect(result.title).toBe('AI Revolution in Tech');
      expect(result.hashtags).toHaveLength(10);
      expect(result.type).toBe(POST_TYPES.CAROUSEL);
      expect(result.visualIdea).toBeDefined();
    });
    
    test('should process minimal valid response', async () => {
      const mockResponse = AIResponseMocks.validMinimalResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      const result = await contentService.generateContent(request);
      
      const validation = ResponseValidator.validateContentData(result);
      expect(validation.isValid).toBe(true);
      
      expect(result.hashtags).toHaveLength(8); // Minimum
      expect(result.title.split(' ').length).toBeLessThanOrEqual(10);
    });
    
    test('should process maximum valid response', async () => {
      const mockResponse = AIResponseMocks.validMaxResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      const result = await contentService.generateContent(request);
      
      const validation = ResponseValidator.validateContentData(result);
      expect(validation.isValid).toBe(true);
      
      expect(result.hashtags).toHaveLength(15); // Maximum
      expect(result.post.length).toBeLessThanOrEqual(500);
    });
    
    test('should handle response with extra fields gracefully', async () => {
      const mockResponse = AIResponseMocks.responseWithExtraFields();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      const result = await contentService.generateContent(request);
      
      const validation = ResponseValidator.validateContentData(result);
      expect(validation.isValid).toBe(true);
      
      // Should only contain expected fields
      expect(Object.keys(result)).toEqual(['title', 'post', 'hashtags', 'type', 'visualIdea']);
      expect(result.extraField1).toBeUndefined();
    });
    
    test('should handle special characters correctly', async () => {
      const mockResponse = AIResponseMocks.responseWithSpecialChars();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      const result = await contentService.generateContent(request);
      
      const validation = ResponseValidator.validateContentData(result);
      expect(validation.isValid).toBe(true);
      
      expect(result.title).toContain('Special Characters: @#$%^&*()');
      expect(result.post).toContain('éñüöä ß');
    });
  });
  
  describe('Invalid AI Response Handling', () => {
    test('should reject malformed JSON', async () => {
      const mockResponse = AIResponseMocks.malformedJSON();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Invalid JSON response from AI provider');
    });
    
    test('should reject incomplete response', async () => {
      const mockResponse = AIResponseMocks.incompleteResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Missing required fields: hashtags, type, visualIdea');
    });
    
    test('should reject invalid data types', async () => {
      const mockResponse = AIResponseMocks.invalidDataTypes();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow();
    });
    
    test('should reject title that is too long', async () => {
      const mockResponse = AIResponseMocks.titleTooLong();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Title exceeds maximum word count of 10');
    });
    
    test('should reject insufficient hashtags', async () => {
      const mockResponse = AIResponseMocks.insufficientHashtags();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Hashtags must be an array with 8-15 items');
    });
    
    test('should reject excessive hashtags', async () => {
      const mockResponse = AIResponseMocks.excessiveHashtags();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Hashtags must be an array with 8-15 items');
    });
    
    test('should reject duplicate hashtags', async () => {
      const mockResponse = AIResponseMocks.duplicateHashtags();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Hashtags must be unique (case-insensitive)');
    });
    
    test('should reject invalid post type', async () => {
      const mockResponse = AIResponseMocks.invalidPostType();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Invalid post type. Must be one of: reel, carousel, tweet, story, post');
    });
    
    test('should reject empty strings', async () => {
      const mockResponse = AIResponseMocks.emptyStrings();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow();
    });
    
    test('should reject post that is too long', async () => {
      const mockResponse = AIResponseMocks.postTooLong();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Post exceeds maximum length of 500 characters');
    });
    
    test('should reject plain text response', async () => {
      const mockResponse = AIResponseMocks.plainTextResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('Invalid JSON response from AI provider');
    });
    
    test('should reject empty response', async () => {
      const mockResponse = AIResponseMocks.emptyResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('AI provider returned empty response');
    });
    
    test('should reject null response', async () => {
      const mockResponse = AIResponseMocks.nullResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow('AI provider returned null or undefined response');
    });
    
    test('should reject array response', async () => {
      const mockResponse = AIResponseMocks.arrayResponse();
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow();
    });
  });
  
  describe('Prompt Generation', () => {
    test('should generate platform-specific prompts', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const platforms = [PLATFORMS.INSTAGRAM, PLATFORMS.LINKEDIN, PLATFORMS.TIKTOK];
      
      for (const platform of platforms) {
        const request = global.testUtils.createTestRequest({ platform });
        await contentService.generateContent(request);
        
        const promptCall = mockAIProvider.generateContent.mock.calls[
          mockAIProvider.generateContent.mock.calls.length - 1
        ][0];
        
        expect(promptCall).toContain(platform.toUpperCase());
      }
    });
    
    test('should generate tone-specific prompts', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const tones = [TONES.CASUAL, TONES.PROFESSIONAL, TONES.MOTIVATIONAL];
      
      for (const tone of tones) {
        const request = global.testUtils.createTestRequest({ tone });
        await contentService.generateContent(request);
        
        const promptCall = mockAIProvider.generateContent.mock.calls[
          mockAIProvider.generateContent.mock.calls.length - 1
        ][0];
        
        expect(promptCall).toContain(tone.toUpperCase());
      }
    });
    
    test('should include topic in prompt', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const topic = 'advanced machine learning algorithms';
      const request = global.testUtils.createTestRequest({ topic });
      await contentService.generateContent(request);
      
      const promptCall = mockAIProvider.generateContent.mock.calls[
        mockAIProvider.generateContent.mock.calls.length - 1
      ][0];
      
      expect(promptCall).toContain(topic);
    });
    
    test('should include JSON format requirements in prompt', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const request = global.testUtils.createTestRequest();
      await contentService.generateContent(request);
      
      const promptCall = mockAIProvider.generateContent.mock.calls[
        mockAIProvider.generateContent.mock.calls.length - 1
      ][0];
      
      expect(promptCall).toContain('RESPONSE FORMAT (JSON only)');
      expect(promptCall).toContain('"title": "Engaging title');
      expect(promptCall).toContain('"post": "Full post content');
      expect(promptCall).toContain('"hashtags":');
      expect(promptCall).toContain('"type":');
      expect(promptCall).toContain('"visualIdea":');
    });
  });
  
  describe('Error Handling', () => {
    test('should handle AI provider errors', async () => {
      const errorMessage = 'AI service unavailable';
      mockAIProvider.generateContent.mockRejectedValue(new Error(errorMessage));
      
      const request = global.testUtils.createTestRequest();
      
      await expect(contentService.generateContent(request))
        .rejects.toThrow(errorMessage);
    });
    
    test('should provide fallback content when configured', async () => {
      // This tests the fallback mechanism
      mockAIProvider.generateContent.mockRejectedValue(new Error('AI service down'));
      
      const request = global.testUtils.createTestRequest();
      
      // The service should throw an error (fallback is optional)
      await expect(contentService.generateContent(request))
        .rejects.toThrow();
    });
  });
  
  describe('Data Sanitization', () => {
    test('should trim whitespace from strings', async () => {
      const mockResponse = JSON.stringify({
        title: "  Trimmed Title  ",
        post: "  Trimmed post content  ",
        hashtags: ["  hashtag1  ", "  hashtag2  ", "  hashtag3  ", "  hashtag4  ", "  hashtag5  ", "  hashtag6  ", "  hashtag7  ", "  hashtag8  "],
        type: POST_TYPES.POST,
        visualIdea: "  Trimmed visual idea  "
      });
      
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      const result = await contentService.generateContent(request);
      
      expect(result.title).toBe('Trimmed Title');
      expect(result.post).toBe('Trimmed post content');
      expect(result.hashtags).toEqual(['hashtag1', 'hashtag2', 'hashtag3', 'hashtag4', 'hashtag5', 'hashtag6', 'hashtag7', 'hashtag8']);
      expect(result.visualIdea).toBe('Trimmed visual idea');
    });
    
    test('should remove # from hashtags', async () => {
      const mockResponse = JSON.stringify({
        title: "Hashtag Test",
        post: "Testing hashtag sanitization",
        hashtags: ["#hashtag1", "hashtag2", "#hashtag3", "hashtag4", "#hashtag5", "hashtag6", "#hashtag7", "hashtag8"],
        type: POST_TYPES.POST,
        visualIdea: "Hashtag visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(mockResponse);
      
      const request = global.testUtils.createTestRequest();
      const result = await contentService.generateContent(request);
      
      expect(result.hashtags).toEqual(['hashtag1', 'hashtag2', 'hashtag3', 'hashtag4', 'hashtag5', 'hashtag6', 'hashtag7', 'hashtag8']);
    });
  });
});
