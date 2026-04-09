/**
 * Edge case tests for malformed and unusual AI responses
 */

const request = require('supertest');
const app = require('../../src/index');
const AIResponseMocks = require('../mocks/aiResponses');
const ResponseValidator = require('../utils/responseValidator');
const { PLATFORMS, TONES } = require('../../src/types');

// Mock the AI provider
jest.mock('../../src/providers/openai');

describe('Edge Cases - Malformed AI Responses', () => {
  let mockAIProvider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    const ContentController = require('../../src/controllers/contentController');
    const controller = new ContentController();
    mockAIProvider = controller.contentService.aiProvider;
  });
  
  describe('JSON Parsing Edge Cases', () => {
    test('should handle JSON with trailing comma', async () => {
      const malformedResponse = `{
        "title": "Test Title",
        "post": "Test post",
        "hashtags": ["test1", "test2"],
        "type": "post",
        "visualIdea": "test visual",
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(malformedResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid JSON response');
    });
    
    test('should handle JSON with comments', async () => {
      const jsonWithComments = `{
        "title": "Test Title", // This is a comment
        "post": "Test post", /* Another comment */
        "hashtags": ["test1", "test2"],
        "type": "post",
        "visualIdea": "test visual"
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(jsonWithComments);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle JSON with single quotes', async () => {
      const singleQuoteJson = `{
        'title': 'Test Title',
        'post': 'Test post',
        'hashtags': ['test1', 'test2'],
        'type': 'post',
        'visualIdea': 'test visual'
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(singleQuoteJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle JSON with unescaped characters', async () => {
      const unescapedJson = `{
        "title": "Title with "quotes" inside",
        "post": "Post with \\ backslash",
        "hashtags": ["test1", "test2"],
        "type": "post",
        "visualIdea": "Visual with \n newline"
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(unescapedJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Data Type Edge Cases', () => {
    test('should handle numeric strings in string fields', async () => {
      const numericStringResponse = JSON.stringify({
        title: "123",
        post: "456",
        hashtags: ["789", "012", "345", "678", "901", "234", "567", "890"],
        type: "post",
        visualIdea: "999"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(numericStringResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('123');
      expect(response.body.data.post).toBe('456');
    });
    
    test('should handle boolean values in string fields', async () => {
      const booleanResponse = JSON.stringify({
        title: true,
        post: false,
        hashtags: ["true", "false", "test", "case", "edge", "data", "type", "validation"],
        type: "post",
        visualIdea: true
      });
      
      mockAIProvider.generateContent.mockResolvedValue(booleanResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle array with mixed types', async () => {
      const mixedArrayResponse = JSON.stringify({
        title: "Mixed Array Test",
        post: "Testing mixed arrays",
        hashtags: ["string", 123, true, null, undefined, {object: "test"}, ["nested"], "final"],
        type: "post",
        visualIdea: "Mixed array visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(mixedArrayResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Content Validation Edge Cases', () => {
    test('should handle hashtags with special characters', async () => {
      const specialCharHashtags = JSON.stringify({
        title: "Special Characters",
        post: "Testing special characters in hashtags",
        hashtags: ["test-hashtag", "test_hashtag", "test.hashtag", "test#hashtag", "test@hashtag", "test!hashtag", "test$hashtag", "test%hashtag"],
        type: "post",
        visualIdea: "Special character visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(specialCharHashtags);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hashtags).toHaveLength(8);
    });
    
    test('should handle hashtags with emojis', async () => {
      const emojiHashtags = JSON.stringify({
        title: "Emoji Test",
        post: "Testing emojis in hashtags",
        hashtags: ["testrocket", "testfire", "teststar", "testheart", "testsmile", "testthumbsup", "testrainbow", "testsparkles"],
        type: "post",
        visualIdea: "Emoji visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(emojiHashtags);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should handle extremely long single word in title', async () => {
      const longWordTitle = JSON.stringify({
        title: "Supercalifragilisticexpialidocious",
        post: "Testing extremely long words",
        hashtags: ["long", "word", "test", "case", "edge", "validation", "title", "check"],
        type: "post",
        visualIdea: "Long word visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(longWordTitle);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title.split(' ').length).toBe(1); // Still 1 word
    });
    
    test('should handle post with only whitespace', async () => {
      const whitespacePost = JSON.stringify({
        title: "Whitespace Test",
        post: "   \n\t   ",
        hashtags: ["whitespace", "test", "validation", "edge", "case", "empty", "content", "check"],
        type: "post",
        visualIdea: "Whitespace visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(whitespacePost);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Unicode and Encoding Edge Cases', () => {
    test('should handle Unicode characters', async () => {
      const unicodeResponse = JSON.stringify({
        title: "Unicode Test: café résumé naïve",
        post: "Testing Unicode: español, français, deutsch, português, italiano",
        hashtags: ["unicode", "café", "résumé", "naïve", "español", "français", "deutsch", "português"],
        type: "post",
        visualIdea: "Unicode character visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(unicodeResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toContain('café');
    });
    
    test('should handle zero-width characters', async () => {
      const zeroWidthResponse = JSON.stringify({
        title: "Zero\u200Bwidth\u200Ctest\u200D",
        post: "Testing zero-width characters",
        hashtags: ["zero", "width", "test", "unicode", "hidden", "chars", "edge", "case"],
        type: "post",
        visualIdea: "Zero-width character visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(zeroWidthResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should handle right-to-left text', async () => {
      const rtlResponse = JSON.stringify({
        title: "RTL test: Arabic Arabic",
        post: "Testing right-to-left text: Hebrew Hebrew",
        hashtags: ["rtl", "arabic", "hebrew", "test", "unicode", "direction", "text", "edge"],
        type: "post",
        visualIdea: "RTL text visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(rtlResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('AI Provider Failure Scenarios', () => {
    test('should handle AI provider returning undefined', async () => {
      mockAIProvider.generateContent.mockResolvedValue(undefined);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle AI provider throwing non-Error objects', async () => {
      mockAIProvider.generateContent.mockImplementation(() => {
        throw "String error instead of Error object";
      });
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle AI provider throwing null', async () => {
      mockAIProvider.generateContent.mockImplementation(() => {
        throw null;
      });
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle AI provider timeout', async () => {
      mockAIProvider.generateContent.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('ETIMEDOUT')), 100);
        });
      });
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Request Payload Edge Cases', () => {
    test('should handle topic with only numbers', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: '123456789',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should handle topic with special characters only', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: '@#$%^&*()',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should handle topic with mixed languages', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'English español français Deutsch',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Memory and Resource Edge Cases', () => {
    test('should handle very large response from AI', async () => {
      const largeResponse = {
        title: "Large Response Test",
        post: "x".repeat(400), // Large but within limits
        hashtags: Array(15).fill().map((_, i) => `hashtag${i}`),
        type: "post",
        visualIdea: "x".repeat(200)
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(largeResponse));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should handle deeply nested objects (should be filtered)', async () => {
      const nestedResponse = JSON.stringify({
        title: "Nested Test",
        post: "Testing nested objects",
        hashtags: ["test", "nested", "objects", "edge", "case", "validation", "data", "structure"],
        type: "post",
        visualIdea: "Nested visualization",
        nested: {
          deep: {
            deeper: {
              deepest: "value"
            }
          }
        }
      });
      
      mockAIProvider.generateContent.mockResolvedValue(nestedResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nested).toBeUndefined(); // Should be filtered out
    });
  });
});
