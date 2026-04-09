/**
 * Integration tests for the complete API pipeline
 */

const request = require('supertest');
const app = require('../../src/index');
const ResponseValidator = require('../utils/responseValidator');
const { PLATFORMS, TONES, POST_TYPES } = require('../../src/types');

// Mock the AI provider for controlled testing
jest.mock('../../src/providers/openai');
const AIResponseMocks = require('../mocks/aiResponses');

describe('API Integration Tests', () => {
  let mockAIProvider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked AI provider from the service
    const ContentController = require('../../src/controllers/contentController');
    const controller = new ContentController();
    mockAIProvider = controller.contentService.aiProvider;
  });
  
  describe('POST /ai/generate-content - Happy Path', () => {
    test('should generate content successfully for Instagram casual', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning basics',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const validation = ResponseValidator.validateApiResponse(response.body);
      expect(validation.isValid).toBe(true);
      
      // Verify AI provider was called
      expect(mockAIProvider.generateContent).toHaveBeenCalledTimes(1);
      
      // Verify response structure
      expect(response.body.data.title).toBeDefined();
      expect(response.body.data.post).toBeDefined();
      expect(response.body.data.hashtags).toBeDefined();
      expect(response.body.data.type).toBeDefined();
      expect(response.body.data.visualIdea).toBeDefined();
      
      // Verify metadata
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.generatedAt).toBeDefined();
      expect(response.body.metadata.processingTime).toBeDefined();
      expect(typeof response.body.metadata.processingTime).toBe('number');
    });
    
    test('should generate content successfully for LinkedIn professional', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'cloud computing strategies',
          platform: PLATFORMS.LINKEDIN,
          tone: TONES.PROFESSIONAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const validation = ResponseValidator.validateApiResponse(response.body);
      expect(validation.isValid).toBe(true);
    });
    
    test('should generate content successfully for TikTok motivational', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'coding productivity',
          platform: PLATFORMS.TIKTOK,
          tone: TONES.MOTIVATIONAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const validation = ResponseValidator.validateApiResponse(response.body);
      expect(validation.isValid).toBe(true);
    });
    
    test('should handle different topic lengths', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const topics = [
        'AI',
        'machine learning',
        'advanced machine learning algorithms and neural networks',
        'the complete guide to understanding artificial intelligence and its applications in modern technology'
      ];
      
      for (const topic of topics) {
        const response = await request(app)
          .post('/ai/generate-content')
          .send({
            topic,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        const validation = ResponseValidator.validateApiResponse(response.body);
        expect(validation.isValid).toBe(true);
      }
    });
  });
  
  describe('POST /ai/generate-content - Input Validation', () => {
    test('should reject empty topic', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: '',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      
      const validation = ResponseValidator.validateErrorResponse(response.body);
      expect(validation.isValid).toBe(true);
      expect(response.body.error).toContain('Validation failed');
    });
    
    test('should reject topic that is too short', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'AI',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject topic that is too long', async () => {
      const longTopic = 'a'.repeat(201);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: longTopic,
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject invalid platform', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: 'facebook',
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      
      const validation = ResponseValidator.validateErrorResponse(response.body);
      expect(validation.isValid).toBe(true);
    });
    
    test('should reject invalid tone', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: 'funny'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject missing fields', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning'
          // Missing platform and tone
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject extra fields gracefully', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL,
          extraField: 'should be ignored',
          anotherField: 123
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('POST /ai/generate-content - AI Response Handling', () => {
    test('should handle malformed JSON from AI', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.malformedJSON());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid JSON response');
    });
    
    test('should handle incomplete AI response', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.incompleteResponse());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle AI provider errors', async () => {
      mockAIProvider.generateContent.mockRejectedValue(new Error('AI service unavailable'));
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should handle AI timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockAIProvider.generateContent.mockRejectedValue(timeoutError);
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /ai/generate-content - Content Validation', () => {
    test('should reject content with title too long', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.titleTooLong());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject content with insufficient hashtags', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.insufficientHashtags());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject content with excessive hashtags', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.excessiveHashtags());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject content with duplicate hashtags', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.duplicateHashtags());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject content with invalid post type', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.invalidPostType());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('should reject content with post too long', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.postTooLong());
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /health - Health Check', () => {
    test('should return healthy status when AI provider is available', async () => {
      mockAIProvider.healthCheck.mockResolvedValue(true);
      
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.services.ai).toBe('available');
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.memory).toBeDefined();
    });
    
    test('should return unhealthy status when AI provider is unavailable', async () => {
      mockAIProvider.healthCheck.mockResolvedValue(false);
      
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.services.ai).toBe('unavailable');
    });
    
    test('should handle health check errors gracefully', async () => {
      mockAIProvider.healthCheck.mockRejectedValue(new Error('Health check failed'));
      
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
    });
  });
  
  describe('GET /api/info - API Information', () => {
    test('should return API information', async () => {
      const response = await request(app).get('/api/info');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.platforms).toEqual(Object.values(PLATFORMS));
      expect(response.body.data.tones).toEqual(Object.values(TONES));
      expect(response.body.data.postTypes).toEqual(Object.values(POST_TYPES));
      expect(response.body.data.limits).toBeDefined();
    });
  });
  
  describe('GET / - Root Endpoint', () => {
    test('should return welcome message', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('running');
      expect(response.body.version).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
    
    test('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect(response.status).toBe(400);
    });
    
    test('should handle missing content-type header', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send('some data');
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('Performance', () => {
    test('should respond within reasonable time', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.body.metadata.processingTime).toBeGreaterThan(0);
    });
    
    test('should handle concurrent requests', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const requests = Array(5).fill().map(() =>
        request(app)
          .post('/ai/generate-content')
          .send({
            topic: 'machine learning',
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          })
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        const validation = ResponseValidator.validateApiResponse(response.body);
        expect(validation.isValid).toBe(true);
      });
    });
  });
  
  describe('Security', () => {
    test('should handle XSS attempts in topic', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const xssTopic = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: xssTopic,
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      // The XSS should be handled/sanitized appropriately
      expect(response.body.data.post).not.toContain('<script>');
    });
    
    test('should handle SQL injection attempts', async () => {
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      const sqlInjectionTopic = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: sqlInjectionTopic,
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
    });
  });
});
