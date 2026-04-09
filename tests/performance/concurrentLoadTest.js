/**
 * Concurrent Load Test - 20 Simultaneous Requests
 * Measures response time, failure rate, and system stability
 */

const request = require('supertest');
const app = require('../../src/index');
const { PLATFORMS, TONES, POST_TYPES } = require('../../src/types');

// Mock the AI provider for consistent testing
jest.mock('../../src/providers/openai');

describe('Concurrent Load Test - 20 Simultaneous Requests', () => {
  let mockAIProvider;
  let server;
  
  beforeAll(async () => {
    // Start server for testing
    server = app.listen(0); // Use random port
    
    const ContentController = require('../../src/controllers/contentController');
    const controller = new ContentController();
    mockAIProvider = controller.contentService.aiProvider;
    
    // Mock successful AI response
    const mockResponse = JSON.stringify({
      title: "Concurrent Test Content",
      post: "This is test content for concurrent load testing",
      hashtags: ["concurrent", "test", "load", "performance", "stability", "api", "testing", "validation"],
      type: POST_TYPES.POST,
      visualIdea: "Performance testing visualization"
    });
    
    mockAIProvider.generateContent.mockResolvedValue(mockResponse);
  });
  
  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
  
  test('should handle 20 concurrent requests successfully', async () => {
    const concurrentRequests = 20;
    const startTime = Date.now();
    
    // Create 20 different requests to simulate real usage
    const requests = Array.from({ length: concurrentRequests }, (_, i) => {
      const topics = [
        'machine learning',
        'artificial intelligence',
        'web development',
        'data science',
        'cloud computing',
        'cybersecurity',
        'mobile development',
        'blockchain technology',
        'devops practices',
        'ui/ux design',
        'software engineering',
        'database management',
        'network security',
        'api development',
        'microservices',
        'containerization',
        'agile methodology',
        'testing strategies',
        'code optimization',
        'system architecture'
      ];
      
      const platforms = [PLATFORMS.INSTAGRAM, PLATFORMS.LINKEDIN, PLATFORMS.TIKTOK];
      const tones = [TONES.CASUAL, TONES.PROFESSIONAL, TONES.MOTIVATIONAL];
      
      return request(app)
        .post('/ai/generate-content')
        .send({
          topic: topics[i % topics.length],
          platform: platforms[i % platforms.length],
          tone: tones[i % tones.length]
        });
    });
    
    console.log(`\n=== CONCURRENT LOAD TEST ===`);
    console.log(`Sending ${concurrentRequests} simultaneous requests...`);
    
    // Execute all requests simultaneously
    const results = await Promise.allSettled(requests);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200));
    
    const responseTimes = successful.map(r => {
      const response = r.value;
      return response.headers['x-response-time'] || 0;
    }).filter(time => time > 0);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    
    const successRate = (successful.length / concurrentRequests) * 100;
    const failureRate = (failed.length / concurrentRequests) * 100;
    
    // Log detailed results
    console.log(`\n=== LOAD TEST RESULTS ===`);
    console.log(`Total Requests: ${concurrentRequests}`);
    console.log(`Successful: ${successful.length} (${successRate.toFixed(1)}%)`);
    console.log(`Failed: ${failed.length} (${failureRate.toFixed(1)}%)`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${minResponseTime}ms`);
    console.log(`Max Response Time: ${maxResponseTime}ms`);
    console.log(`Requests/Second: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);
    
    // Analyze failures
    if (failed.length > 0) {
      console.log(`\n=== FAILURE ANALYSIS ===`);
      failed.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.log(`Failure ${index + 1}: Promise rejected - ${result.reason?.message || 'Unknown error'}`);
        } else {
          const response = result.value;
          console.log(`Failure ${index + 1}: HTTP ${response.status} - ${response.body?.error || 'No error message'}`);
        }
      });
    }
    
    // Performance assertions
    expect(successful.length).toBeGreaterThan(concurrentRequests * 0.9); // At least 90% success rate
    expect(failureRate).toBeLessThan(10); // Less than 10% failure rate
    expect(avgResponseTime).toBeLessThan(5000); // Average response time under 5 seconds
    expect(maxResponseTime).toBeLessThan(10000); // Max response time under 10 seconds
    
    // Stability assertions
    expect(successful.length).toBe(concurrentRequests); // All requests should succeed
    expect(failed.length).toBe(0); // No failures expected
    
    console.log(`\n=== STABILITY ASSESSMENT ===`);
    if (failed.length === 0) {
      console.log(`Status: STABLE - All requests handled successfully`);
    } else if (failureRate < 5) {
      console.log(`Status: MOSTLY STABLE - Low failure rate`);
    } else {
      console.log(`Status: UNSTABLE - High failure rate detected`);
    }
    
    // Performance rating
    if (avgResponseTime < 1000) {
      console.log(`Performance: EXCELLENT - Average response time under 1 second`);
    } else if (avgResponseTime < 3000) {
      console.log(`Performance: GOOD - Average response time under 3 seconds`);
    } else if (avgResponseTime < 5000) {
      console.log(`Performance: ACCEPTABLE - Average response time under 5 seconds`);
    } else {
      console.log(`Performance: POOR - Average response time exceeds 5 seconds`);
    }
    
    console.log(`\n=== TEST COMPLETED ===`);
  }, 30000); // 30 second timeout
  
  test('should handle 20 concurrent requests with varied response times', async () => {
    const concurrentRequests = 20;
    
    // Mock AI provider with varying response times
    mockAIProvider.generateContent.mockImplementation(async (prompt) => {
      // Simulate varying AI response times (100ms to 2000ms)
      const delay = Math.random() * 1900 + 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return JSON.stringify({
        title: "Variable Response Time Test",
        post: `Content generated after ${delay}ms delay`,
        hashtags: ["variable", "timing", "test", "performance", "load", "concurrent", "delay", "simulation"],
        type: POST_TYPES.POST,
        visualIdea: "Variable timing visualization"
      });
    });
    
    const startTime = Date.now();
    
    // Create concurrent requests
    const requests = Array.from({ length: concurrentRequests }, (_, i) => 
      request(app)
        .post('/ai/generate-content')
        .send({
          topic: `concurrent test ${i + 1}`,
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        })
    );
    
    // Execute all requests simultaneously
    const results = await Promise.allSettled(requests);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200));
    
    const successRate = (successful.length / concurrentRequests) * 100;
    const failureRate = (failed.length / concurrentRequests) * 100;
    
    console.log(`\n=== VARIABLE TIMING TEST RESULTS ===`);
    console.log(`Total Requests: ${concurrentRequests}`);
    console.log(`Successful: ${successful.length} (${successRate.toFixed(1)}%)`);
    console.log(`Failed: ${failed.length} (${failureRate.toFixed(1)}%)`);
    console.log(`Total Execution Time: ${totalTime}ms`);
    console.log(`Requests/Second: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);
    
    // Assertions for stability under variable timing
    expect(successful.length).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success rate
    expect(failureRate).toBeLessThan(20); // Less than 20% failure rate
    
    console.log(`Variable timing test completed successfully`);
  }, 35000); // 35 second timeout
  
  test('should handle 20 concurrent requests with some failures', async () => {
    const concurrentRequests = 20;
    const failureRate = 0.2; // 20% of requests will fail
    
    // Mock AI provider with controlled failures
    let requestCount = 0;
    mockAIProvider.generateContent.mockImplementation(async (prompt) => {
      requestCount++;
      
      // Simulate 20% failure rate
      if (requestCount % 5 === 0) {
        throw new Error('Simulated AI provider failure');
      }
      
      // Simulate normal response
      const delay = Math.random() * 500 + 100; // 100-600ms
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return JSON.stringify({
        title: "Partial Failure Test",
        post: `Content for request ${requestCount}`,
        hashtags: ["partial", "failure", "test", "resilience", "stability", "error", "handling", "recovery"],
        type: POST_TYPES.POST,
        visualIdea: "Partial failure visualization"
      });
    });
    
    const startTime = Date.now();
    
    // Create concurrent requests
    const requests = Array.from({ length: concurrentRequests }, (_, i) => 
      request(app)
        .post('/ai/generate-content')
        .send({
          topic: `partial failure test ${i + 1}`,
          platform: PLATFORMS.LINKEDIN,
          tone: TONES.PROFESSIONAL
        })
    );
    
    // Execute all requests simultaneously
    const results = await Promise.allSettled(requests);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200));
    
    const actualFailureRate = (failed.length / concurrentRequests) * 100;
    const actualSuccessRate = (successful.length / concurrentRequests) * 100;
    
    console.log(`\n=== PARTIAL FAILURE TEST RESULTS ===`);
    console.log(`Total Requests: ${concurrentRequests}`);
    console.log(`Successful: ${successful.length} (${actualSuccessRate.toFixed(1)}%)`);
    console.log(`Failed: ${failed.length} (${actualFailureRate.toFixed(1)}%)`);
    console.log(`Expected Failure Rate: ${(failureRate * 100).toFixed(1)}%`);
    console.log(`Total Execution Time: ${totalTime}ms`);
    
    // Analyze error handling
    const httpErrors = failed.filter(r => r.status === 'fulfilled' && r.value.status !== 200);
    const promiseErrors = failed.filter(r => r.status === 'rejected');
    
    console.log(`HTTP Errors: ${httpErrors.length}`);
    console.log(`Promise Errors: ${promiseErrors.length}`);
    
    // Assertions for graceful failure handling
    expect(successful.length).toBeGreaterThan(0); // Some requests should succeed
    expect(failed.length).toBeGreaterThan(0); // Some requests should fail
    expect(actualFailureRate).toBeGreaterThan(10); // At least some failures
    expect(actualFailureRate).toBeLessThan(50); // But not too many failures
    
    // System should remain stable despite failures
    console.log(`System remained stable despite ${failed.length} failures`);
    console.log(`Partial failure test completed successfully`);
  }, 30000); // 30 second timeout
});
