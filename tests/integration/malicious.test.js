/**
 * Malicious testing - Attempt to break the system
 * These tests try to exploit vulnerabilities and edge cases
 */

const request = require('supertest');
const app = require('../../src/index');
const { PLATFORMS, TONES, POST_TYPES } = require('../../src/types');

// Mock the AI provider with malicious responses
jest.mock('../../src/providers/openai');

describe('Malicious Tests - Breaking the System', () => {
  let mockAIProvider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    const ContentController = require('../../src/controllers/contentController');
    const controller = new ContentController();
    mockAIProvider = controller.contentService.aiProvider;
  });
  
  describe('Extreme JSON Attacks', () => {
    test('should handle deeply nested JSON objects', async () => {
      const deeplyNested = {
        title: "Nested Attack",
        post: "Testing nested objects",
        hashtags: ["test", "nested", "attack", "malicious", "json", "injection", "security", "test"],
        type: POST_TYPES.POST,
        visualIdea: "Nested visualization",
        nested: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      level7: {
                        level8: {
                          level9: {
                            level10: {
                              deep: "very deep nesting",
                              array: Array(1000).fill().map((_, i) => ({ id: i, data: "x".repeat(100) }))
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(deeplyNested));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'nested attack test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // System should handle this gracefully
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data.nested).toBeUndefined(); // Should be filtered out
      }
    });
    
    test('should handle circular reference attempts', async () => {
      // Create an object with circular reference
      const circular = {};
      circular.title = "Circular Reference Attack";
      circular.post = "Testing circular references";
      circular.hashtags = ["circular", "reference", "attack", "malicious", "json", "test", "security", "validation"];
      circular.type = POST_TYPES.POST;
      circular.visualIdea = "Circular visualization";
      circular.self = circular;
      
      // This will cause JSON.stringify to throw
      try {
        const jsonString = JSON.stringify(circular);
        mockAIProvider.generateContent.mockResolvedValue(jsonString);
      } catch (error) {
        // If JSON.stringify fails, mock the error
        mockAIProvider.generateContent.mockRejectedValue(new Error('Circular reference detected'));
      }
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'circular attack test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
    });
    
    test('should handle massive JSON payload', async () => {
      const massivePayload = {
        title: "Massive Payload Attack",
        post: "x".repeat(1000000), // 1MB of text
        hashtags: Array(1000).fill().map((_, i) => `hashtag${i}`), // 1000 hashtags
        type: POST_TYPES.POST,
        visualIdea: "x".repeat(500000), // 500KB visual idea
        massiveData: Array(10000).fill().map((_, i) => ({
          id: i,
          data: "x".repeat(1000),
          nested: {
            more: "data"
          }
        }))
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(massivePayload));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'massive payload attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body.error).toBeDefined();
      }
    });
  });
  
  describe('Extreme Hashtag Attacks', () => {
    test('should handle 100+ hashtags', async () => {
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
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Hashtags must be between 8 and 15 items');
    });
    
    test('should handle 1000+ hashtags', async () => {
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
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle all duplicate hashtags', async () => {
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
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Hashtags must be unique');
    });
    
    test('should handle hashtags with special characters', async () => {
      const specialCharHashtags = {
        title: "Special Character Hashtags",
        post: "Testing special characters in hashtags",
        hashtags: [
          "test\x00null", "test\x01start", "test\x1fend", "test\u2000space", 
          "test\u200bspace", "test\ufeffbom", "test\nnewline", "test\ttab",
          "test\rcarriage", "test'quote", "test\"double", "test\\backslash",
          "test/slash", "test:colon", "test;semicolon", "test<less"
        ],
        type: POST_TYPES.POST,
        visualIdea: "Special character hashtags"
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(specialCharHashtags));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'special character attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
    });
  });
  
  describe('Extreme Text Attacks', () => {
    test('should handle extremely long title', async () => {
      const longTitle = Array(100).fill().map(() => "verylongword").join(" ");
      
      const extremeTitle = {
        title: longTitle,
        post: "Testing extremely long title",
        hashtags: ["long", "title", "attack", "malicious", "text", "injection", "security", "test"],
        type: POST_TYPES.POST,
        visualIdea: "Long title visualization"
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(extremeTitle));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'long title attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Title exceeds maximum word count');
    });
    
    test('should handle extremely long post', async () => {
      const longPost = "x".repeat(1000000); // 1MB post
      
      const extremePost = {
        title: "Long Post Attack",
        post: longPost,
        hashtags: ["long", "post", "attack", "malicious", "text", "injection", "security", "test"],
        type: POST_TYPES.POST,
        visualIdea: "Long post visualization"
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(extremePost));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'long post attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Post exceeds maximum length');
    });
    
    test('should handle extremely long visual idea', async () => {
      const longVisual = "x".repeat(100000); // 100KB visual idea
      
      const extremeVisual = {
        title: "Long Visual Attack",
        post: "Testing extremely long visual idea",
        hashtags: ["long", "visual", "attack", "malicious", "text", "injection", "security", "test"],
        type: POST_TYPES.POST,
        visualIdea: longVisual
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(extremeVisual));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'long visual attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
    });
  });
  
  describe('Invalid JSON Attacks', () => {
    test('should handle completely broken JSON', async () => {
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
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid JSON response');
    });
    
    test('should handle JSON with injection attempts', async () => {
      const injectionJson = `{
        "title": "Injection Attack",
        "post": "Testing JSON injection",
        "hashtags": ["injection", "attack"],
        "type": "post",
        "visualIdea": "Injection visualization",
        "malicious": "</script><script>alert('XSS')</script>",
        "sql": "'; DROP TABLE users; --"
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(injectionJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'injection attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data.malicious).toBeUndefined();
        expect(response.body.data.sql).toBeUndefined();
      }
    });
    
    test('should handle JSON with null bytes', async () => {
      const nullByteJson = `{
        "title": "Null Byte Attack\x00",
        "post": "Testing null bytes\x00 in JSON",
        "hashtags": ["null", "byte", "attack"],
        "type": "post",
        "visualIdea": "Null byte visualization\x00"
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(nullByteJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'null byte attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
    });
  });
  
  describe('Missing Field Attacks', () => {
    test('should handle completely empty response', async () => {
      mockAIProvider.generateContent.mockResolvedValue('');
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'empty response attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid JSON response');
    });
    
    test('should handle response with only one field', async () => {
      const oneFieldJson = JSON.stringify({
        title: "Only Title Field"
        // Missing all other required fields
      });
      
      mockAIProvider.generateContent.mockResolvedValue(oneFieldJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'one field attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });
    
    test('should handle response with null fields', async () => {
      const nullFieldsJson = JSON.stringify({
        title: null,
        post: null,
        hashtags: null,
        type: null,
        visualIdea: null
      });
      
      mockAIProvider.generateContent.mockResolvedValue(nullFieldsJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'null fields attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Data Type Attacks', () => {
    test('should handle all wrong data types', async () => {
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
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle mixed array types in hashtags', async () => {
      const mixedArrayJson = JSON.stringify({
        title: "Mixed Array Types",
        post: "Testing mixed array types",
        hashtags: [
          "string", 
          123, 
          true, 
          null, 
          undefined, 
          { object: "in array" }, 
          ["nested", "array"], 
          function() { return "function"; }
        ],
        type: POST_TYPES.POST,
        visualIdea: "Mixed array visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(mixedArrayJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'mixed array attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('All hashtags must be strings');
    });
  });
  
  describe('Unicode and Encoding Attacks', () => {
    test('should handle zero-width characters', async () => {
      const zeroWidthJson = JSON.stringify({
        title: "Zero\u200BWidth\u200C\u200DTest",
        post: "Testing\u2000zero\u2001width\u2002characters\u2003",
        hashtags: ["zero\u200bwidth", "invisible\u200cchars", "hidden\u200dtext", "unicode\u2000attack", "encoding\u2001test", "invisible\u2002chars", "hidden\u2003content", "malicious\u2004text"],
        type: POST_TYPES.POST,
        visualIdea: "Zero\u2005width\u2006visualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(zeroWidthJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'zero width attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
    });
    
    test('should handle control characters', async () => {
      const controlCharsJson = JSON.stringify({
        title: "Control\x01Chars\x02Test\x03",
        post: "Testing\x04control\x05characters\x06",
        hashtags: ["control\x07chars", "test\x08control", "attack\x0bcontrol", "malicious\x0cchars", "unicode\x0dtest", "encoding\x1ainput", "control\x1bchars", "malicious\x1ctest"],
        type: POST_TYPES.POST,
        visualIdea: "Control\x1fchars\x1evisualization"
      });
      
      mockAIProvider.generateContent.mockResolvedValue(controlCharsJson);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'control chars attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
    });
  });
  
  describe('Memory and Resource Attacks', () => {
    test('should handle memory exhaustion attempt', async () => {
      // Create a response that would consume a lot of memory
      const memoryBomb = {
        title: "Memory Bomb Attack",
        post: "x".repeat(10000000), // 10MB
        hashtags: Array(100000).fill().map((_, i) => `memory${i}`), // 100k hashtags
        type: POST_TYPES.POST,
        visualIdea: "x".repeat(5000000), // 5MB
        memoryData: Array(100000).fill().map((_, i) => ({
          id: i,
          data: "x".repeat(1000),
          nested: Array(100).fill().map((_, j) => ({
            id: j,
            data: "y".repeat(500)
          }))
        }))
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(memoryBomb));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'memory bomb attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
      // Should not crash the server
    });
  });
  
  describe('Protocol and Format Attacks', () => {
    test('should handle XML instead of JSON', async () => {
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
        <response>
          <title>XML Attack</title>
          <post>This is XML, not JSON</post>
          <hashtags>
            <hashtag>xml</hashtag>
            <hashtag>attack</hashtag>
            <hashtag>malicious</hashtag>
            <hashtag>format</hashtag>
            <hashtag>injection</hashtag>
            <hashtag>test</hashtag>
            <hashtag>security</hashtag>
            <hashtag>validation</hashtag>
          </hashtags>
          <type>post</type>
          <visualIdea>XML visualization</visualIdea>
        </response>`;
      
      mockAIProvider.generateContent.mockResolvedValue(xmlResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'xml attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid JSON response');
    });
    
    test('should handle JavaScript code instead of JSON', async () => {
      const jsResponse = `{
        "title": "JavaScript Attack",
        "post": "Testing JavaScript injection",
        "hashtags": ["js", "attack", "malicious"],
        "type": "post",
        "visualIdea": "JavaScript visualization",
        "malicious": "(function(){alert('XSS');return 'evil';})()"
      }`;
      
      mockAIProvider.generateContent.mockResolvedValue(jsResponse);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'javascript attack',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data.malicious).toBeUndefined();
      }
    });
  });
});
