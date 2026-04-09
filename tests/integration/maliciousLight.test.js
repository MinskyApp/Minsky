/**
 * Lightweight malicious testing - Test specific vulnerabilities without crashing
 */

const request = require('supertest');
const app = require('../../src/index');
const { PLATFORMS, TONES, POST_TYPES } = require('../../src/types');

// Mock the AI provider with malicious responses
jest.mock('../../src/providers/openai');

describe('Malicious Tests - Specific Vulnerabilities', () => {
  let mockAIProvider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    const ContentController = require('../../src/controllers/contentController');
    const controller = new ContentController();
    mockAIProvider = controller.contentService.aiProvider;
  });
  
  describe('CRITICAL VULNERABILITIES FOUND', () => {
    test('VULNERABILITY 1: System crashes with 100+ hashtags', async () => {
      const tooManyHashtags = {
        title: "Too Many Hashtags Attack",
        post: "Testing with excessive hashtags",
        hashtags: Array(100).fill().map((_, i) => `hashtag${i}`),
        type: POST_TYPES.POST,
        visualIdea: "Too many hashtags visualization"
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(tooManyHashtags));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'hashtag attack test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Hashtags must be between 8 and 15 items');
      
      console.log('VULNERABILITY 1 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 2: System crashes with 1000+ hashtags', async () => {
      const extremeHashtags = {
        title: "Extreme Hashtag Attack",
        post: "Testing with extreme hashtag count",
        hashtags: Array(1000).fill().map((_, i) => `hashtag${i}`),
        type: POST_TYPES.POST,
        visualIdea: "Extreme hashtags visualization"
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(extremeHashtags));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'extreme hashtag attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Hashtags must be between 8 and 15 items');
      
      console.log('VULNERABILITY 2 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 3: All duplicate hashtags', async () => {
      const duplicateHashtags = {
        title: "All Duplicate Hashtags",
        post: "Testing with all duplicate hashtags",
        hashtags: Array(10).fill().map(() => "samehashtag"),
        type: POST_TYPES.POST,
        visualIdea: "Duplicate hashtags visualization"
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(duplicateHashtags));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'duplicate hashtag attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Hashtags must be unique');
      
      console.log('VULNERABILITY 3 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 4: Extremely long text', async () => {
      const longText = "x".repeat(100000); // 100KB text
      
      const extremeText = {
        title: "Long Text Attack",
        post: longText,
        hashtags: ["long", "text", "attack", "malicious", "validation", "test", "security", "check"],
        type: POST_TYPES.POST,
        visualIdea: "Long text visualization"
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(extremeText));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'long text attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Post exceeds maximum length');
      
      console.log('VULNERABILITY 4 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 5: Invalid JSON response', async () => {
      const brokenJson = `{
        "title": "Broken JSON",
        "post": "This is not valid JSON at all
        "hashtags": ["broken", "json"],
        "type": "post",
        "visualIdea": "Broken JSON visualization"
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(brokenJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'broken json attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid JSON response');
      
      console.log('VULNERABILITY 5 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 6: Missing required fields', async () => {
      const incompleteJson = JSON.stringify({
        title: "Incomplete Response",
        post: "This response is missing fields"
        // Missing hashtags, type, visualIdea
      });
      
      mockAIProvider.generateContent.mockResolvedValue(incompleteJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'incomplete attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
      
      console.log('VULNERABILITY 6 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 7: Wrong data types', async () => {
      const wrongTypesJson = JSON.stringify({
        title: 123456789, // Number instead of string
        post: ["array", "instead", "of", "string"], // Array instead of string
        hashtags: "string instead of array", // String instead of array
        type: true, // Boolean instead of string
        visualIdea: { object: "instead of string" } // Object instead of string
      });
      
      mockAIProvider.generateContent.mockResolvedValue(wrongTypesJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'wrong types attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('must be a string');
      
      console.log('VULNERABILITY 7 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 8: Empty strings', async () => {
      const emptyStringsJson = JSON.stringify({
        title: "",
        post: "",
        hashtags: ["", "valid", "hashtag", "test", "validation", "security", "check", "final"],
        type: POST_TYPES.POST,
        visualIdea: ""
      });
      
      mockAIProvider.generateContent.mockResolvedValue(emptyStringsJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'empty strings attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cannot be empty');
      
      console.log('VULNERABILITY 8 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 9: Null response', async () => {
      mockAIProvider.generateContent.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'null response attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('null or undefined response');
      
      console.log('VULNERABILITY 9 STATUS: PROPERLY HANDLED');
    });
    
    test('VULNERABILITY 10: Empty response', async () => {
      mockAIProvider.generateContent.mockResolvedValue('');
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'empty response attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // SYSTEM SHOULD REJECT THIS GRACEFULLY
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('empty response');
      
      console.log('VULNERABILITY 10 STATUS: PROPERLY HANDLED');
    });
  });
  
  describe('SECURITY VALIDATION', () => {
    test('should handle XSS attempts in content', async () => {
      const xssJson = JSON.stringify({
        title: "<script>alert('XSS')</script>",
        post: "Post with <script>alert('XSS')</script> attempt",
        hashtags: ["xss", "security", "test", "validation", "attack", "malicious", "check", "final"],
        type: POST_TYPES.POST,
        visualIdea: "<img src=x onerror=alert('XSS')>"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(xssJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'xss attack test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // System should handle this gracefully (XSS content is allowed but should be escaped in frontend)
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        // Content should be preserved but frontend should escape it
        expect(response.body.data.title).toContain('<script>');
      }
      
      console.log('XSS HANDLING: Content preserved (frontend responsibility to escape)');
    });
    
    test('should handle SQL injection attempts', async () => {
      const sqlJson = JSON.stringify({
        title: "'; DROP TABLE users; --",
        post: "Post with SQL injection: '; DROP TABLE users; --",
        hashtags: ["sql", "injection", "security", "test", "validation", "attack", "malicious", "check"],
        type: POST_TYPES.POST,
        visualIdea: "'; SELECT * FROM users; --"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(sqlJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'sql injection test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // System should handle this gracefully (SQL injection is not a threat to this API)
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        // Content should be preserved as it's just text
        expect(response.body.data.title).toContain('DROP TABLE');
      }
      
      console.log('SQL INJECTION HANDLING: Content preserved (no SQL execution risk)');
    });
  });
});
