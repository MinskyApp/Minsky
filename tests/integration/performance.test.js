/**
 * Performance and stress tests for the API
 */

const request = require('supertest');
const app = require('../../src/index');
const AIResponseMocks = require('../mocks/aiResponses');
const { PLATFORMS, TONES } = require('../../src/types');

// Mock the AI provider
jest.mock('../../src/providers/openai');

describe('Performance Tests', () => {
  let mockAIProvider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    const ContentController = require('../../src/controllers/contentController');
    const controller = new ContentController();
    mockAIProvider = controller.contentService.aiProvider;
    
    // Set up default successful response
    mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
    mockAIProvider.healthCheck.mockResolvedValue(true);
  });
  
  describe('Response Time Tests', () => {
    test('should respond within 5 seconds for normal request', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'machine learning basics',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000);
      expect(response.body.metadata.processingTime).toBeGreaterThan(0);
    });
    
    test('should respond within 3 seconds for simple request', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'AI',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000);
    });
    
    test('should handle health check quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/health');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
    
    test('should handle API info request quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/api/info');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
  });
  
  describe('Concurrent Request Tests', () => {
    test('should handle 5 concurrent requests', async () => {
      const requests = Array(5).fill().map((_, index) =>
        request(app)
          .post('/ai/generate-content')
          .send({
            topic: `concurrent test ${index}`,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          })
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      // Concurrent requests should be faster than sequential
      expect(totalDuration).toBeLessThan(10000);
    });
    
    test('should handle 10 concurrent requests', async () => {
      const requests = Array(10).fill().map((_, index) =>
        request(app)
          .post('/ai/generate-content')
          .send({
            topic: `stress test ${index}`,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          })
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
    
    test('should handle mixed concurrent requests', async () => {
      const contentRequests = Array(5).fill().map((_, index) =>
        request(app)
          .post('/ai/generate-content')
          .send({
            topic: `mixed test ${index}`,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          })
      );
      
      const healthRequests = Array(3).fill().map(() =>
        request(app).get('/health')
      );
      
      const infoRequests = Array(2).fill().map(() =>
        request(app).get('/api/info')
      );
      
      const allRequests = [...contentRequests, ...healthRequests, ...infoRequests];
      const responses = await Promise.all(allRequests);
      
      // All requests should succeed
      responses.forEach((response) => {
        expect([200, 503]).toContain(response.status);
        expect(response.body.success).toBeDefined();
      });
    });
  });
  
  describe('Load Tests', () => {
    test('should handle 50 sequential requests', async () => {
      const failures = [];
      
      for (let i = 0; i < 50; i++) {
        try {
          const response = await request(app)
            .post('/ai/generate-content')
            .send({
              topic: `load test ${i}`,
              platform: PLATFORMS.INSTAGRAM,
              tone: TONES.CASUAL
            });
          
          if (response.status !== 200) {
            failures.push({ index: i, status: response.status, error: response.body.error });
          }
        } catch (error) {
          failures.push({ index: i, error: error.message });
        }
      }
      
      // Allow some failures but not too many
      expect(failures.length).toBeLessThan(5);
    });
    
    test('should maintain performance under load', async () => {
      const responseTimes = [];
      
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/ai/generate-content')
          .send({
            topic: `performance test ${i}`,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        responseTimes.push(duration);
        expect(response.status).toBe(200);
      }
      
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      
      // Average should be reasonable
      expect(averageTime).toBeLessThan(3000);
      // No single request should take too long
      expect(maxTime).toBeLessThan(8000);
    });
  });
  
  describe('Memory Usage Tests', () => {
    test('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make multiple requests
      for (let i = 0; i < 30; i++) {
        await request(app)
          .post('/ai/generate-content')
          .send({
            topic: `memory test ${i}`,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory usage should not increase dramatically
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(heapGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });
    
    test('should handle large responses efficiently', async () => {
      const largeResponse = {
        title: "Large Response Test",
        post: "x".repeat(400),
        hashtags: Array(15).fill().map((_, i) => `largeresponsehashtag${i}`),
        type: "post",
        visualIdea: "x".repeat(200)
      };
      
      mockAIProvider.generateContent.mockResolvedValue(JSON.stringify(largeResponse));
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'large response test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000);
    });
  });
  
  describe('Error Handling Performance', () => {
    test('should handle validation errors quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: '', // Invalid: empty
          platform: 'invalid', // Invalid: not supported
          tone: 'invalid' // Invalid: not supported
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(400);
      expect(duration).toBeLessThan(1000);
    });
    
    test('should handle AI provider errors quickly', async () => {
      mockAIProvider.generateContent.mockRejectedValue(new Error('AI service down'));
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'error test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(500);
      expect(duration).toBeLessThan(2000);
    });
  });
  
  describe('Rate Limiting Behavior', () => {
    test('should handle rapid sequential requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/ai/generate-content')
          .send({
            topic: `rapid test ${i}`,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          });
        
        responses.push(response);
      }
      
      // Most should succeed, some might be rate limited
      const successCount = responses.filter(r => r.status === 200).length;
      const errorCount = responses.filter(r => r.status !== 200).length;
      
      expect(successCount).toBeGreaterThan(5);
      // Note: This test assumes no rate limiting is implemented
      // If rate limiting is added, adjust expectations accordingly
    });
  });
  
  describe('Resource Cleanup Tests', () => {
    test('should clean up resources between requests', async () => {
      // Make a request that will fail
      mockAIProvider.generateContent.mockRejectedValueOnce(new Error('Temporary failure'));
      
      const failResponse = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'fail test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(failResponse.status).toBe(500);
      
      // Reset to success
      mockAIProvider.generateContent.mockResolvedValue(AIResponseMocks.validResponse());
      
      // Next request should succeed
      const successResponse = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'recovery test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(successResponse.status).toBe(200);
    });
  });
  
  describe('Timeout Handling', () => {
    test('should handle slow AI responses', async () => {
      // Simulate slow AI response
      mockAIProvider.generateContent.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(AIResponseMocks.validResponse()), 8000);
        });
      });
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'timeout test',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should either succeed (if no timeout) or fail gracefully
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(duration).toBeGreaterThan(7000);
      }
    });
  });
});
