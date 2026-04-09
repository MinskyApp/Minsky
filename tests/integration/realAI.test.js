/**
 * Real AI integration tests
 * These tests use the actual OpenAI API with the provided API key
 * Run these tests separately and with care as they consume API credits
 */

const request = require('supertest');
const app = require('../../src/index');
const { PLATFORMS, TONES } = require('../../src/types');
const ResponseValidator = require('../utils/responseValidator');

// These tests should only run when REAL_AI_TESTS is set to true
const runRealTests = process.env.REAL_AI_TESTS === 'true';

describe.skipIf(!runRealTests)('Real AI Integration Tests', () => {
  let originalApiKey;
  
  beforeAll(() => {
    // Store original API key and set provided one for testing
    originalApiKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test_key_for_real_ai_tests';
  });
  
  afterAll(() => {
    // Restore original API key
    process.env.GROQ_API_KEY = originalApiKey;
  });
  
  describe('Real AI Content Generation', () => {
    test('should generate real content for Instagram casual', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'web development best practices',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Validate the response structure
      const validation = ResponseValidator.validateApiResponse(response.body);
      expect(validation.isValid).toBe(true);
      
      // Validate content quality
      const { data } = response.body;
      expect(data.title).toBeTruthy();
      expect(data.post).toBeTruthy();
      expect(data.hashtags).toHaveLength(8, 15);
      expect(data.type).toBeTruthy();
      expect(data.visualIdea).toBeTruthy();
      
      // Check content relevance
      expect(data.post.toLowerCase()).toContain('web');
      expect(data.title.split(' ').length).toBeLessThanOrEqual(10);
      expect(data.post.length).toBeLessThanOrEqual(500);
      
      console.log('Generated Instagram Content:', JSON.stringify(data, null, 2));
    }, 15000);
    
    test('should generate real content for LinkedIn professional', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'cloud computing adoption strategies',
          platform: PLATFORMS.LINKEDIN,
          tone: TONES.PROFESSIONAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const validation = ResponseValidator.validateApiResponse(response.body);
      expect(validation.isValid).toBe(true);
      
      const { data } = response.body;
      expect(data.post.toLowerCase()).toContain('cloud');
      expect(data.post.length).toBeGreaterThan(50); // Professional content should be substantial
      
      console.log('Generated LinkedIn Content:', JSON.stringify(data, null, 2));
    }, 15000);
    
    test('should generate real content for TikTok motivational', async () => {
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'coding productivity hacks',
          platform: PLATFORMS.TIKTOK,
          tone: TONES.MOTIVATIONAL
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const validation = ResponseValidator.validateApiResponse(response.body);
      expect(validation.isValid).toBe(true);
      
      const { data } = response.body;
      expect(data.post.toLowerCase()).toContain('code');
      
      // TikTok content should be engaging
      expect(data.post).toMatch(/!|\?|rocket|fire|star/i);
      
      console.log('Generated TikTok Content:', JSON.stringify(data, null, 2));
    }, 15000);
  });
  
  describe('Real AI Content Quality', () => {
    test('should generate unique content for multiple requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/ai/generate-content')
          .send({
            topic: 'artificial intelligence trends',
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          });
        
        expect(response.status).toBe(200);
        responses.push(response.body.data);
      }
      
      // Content should be different each time
      const titles = responses.map(r => r.title);
      const uniqueTitles = [...new Set(titles)];
      expect(uniqueTitles.length).toBeGreaterThan(1);
      
      const posts = responses.map(r => r.post);
      const uniquePosts = [...new Set(posts)];
      expect(uniquePosts.length).toBeGreaterThan(1);
      
      console.log('Generated variations:', responses.map((r, i) => ({
        variation: i + 1,
        title: r.title,
        post: r.post.substring(0, 100) + '...'
      })));
    }, 30000);
    
    test('should adapt content to different platforms', async () => {
      const topic = 'machine learning basics';
      const platforms = [PLATFORMS.INSTAGRAM, PLATFORMS.LINKEDIN, PLATFORMS.TIKTOK];
      const responses = [];
      
      for (const platform of platforms) {
        const response = await request(app)
          .post('/ai/generate-content')
          .send({
            topic,
            platform,
            tone: TONES.CASUAL
          });
        
        expect(response.status).toBe(200);
        responses.push({ platform, data: response.body.data });
      }
      
      // Content should differ by platform
      const instagramPost = responses.find(r => r.platform === PLATFORMS.INSTAGRAM).data.post;
      const linkedinPost = responses.find(r => r.platform === PLATFORMS.LINKEDIN).data.post;
      const tiktokPost = responses.find(r => r.platform === PLATFORMS.TIKTOK).data.post;
      
      // LinkedIn content should be more professional/longer
      expect(linkedinPost.length).toBeGreaterThan(instagramPost.length);
      
      // TikTok content should be engaging
      expect(tiktokPost).toMatch(/!|\?|rocket|fire|star|wow|amazing/i);
      
      console.log('Platform adaptations:', responses.map(r => ({
        platform: r.platform,
        postLength: r.data.post.length,
        preview: r.data.post.substring(0, 80) + '...'
      })));
    }, 25000);
    
    test('should adapt content to different tones', async () => {
      const topic = 'software development';
      const tones = [TONES.CASUAL, TONES.PROFESSIONAL, TONES.MOTIVATIONAL];
      const responses = [];
      
      for (const tone of tones) {
        const response = await request(app)
          .post('/ai/generate-content')
          .send({
            topic,
            platform: PLATFORMS.INSTAGRAM,
            tone
          });
        
        expect(response.status).toBe(200);
        responses.push({ tone, data: response.body.data });
      }
      
      const casualPost = responses.find(r => r.tone === TONES.CASUAL).data.post;
      const professionalPost = responses.find(r => r.tone === TONES.PROFESSIONAL).data.post;
      const motivationalPost = responses.find(r => r.tone === TONES.MOTIVATIONAL).data.post;
      
      // Casual should be more conversational
      expect(casualPost).toMatch(/you're|it's|don't|can't|we're/i);
      
      // Professional should be more formal
      expect(professionalPost).toMatch(/according|research|analysis|strategy|implementation/i);
      
      // Motivational should be inspiring
      expect(motivationalPost).toMatch(/transform|unlock|master|achieve|success|journey/i);
      
      console.log('Tone adaptations:', responses.map(r => ({
        tone: r.tone,
        preview: r.data.post.substring(0, 80) + '...'
      })));
    }, 25000);
  });
  
  describe('Real AI Error Handling', () => {
    test('should handle real API errors gracefully', async () => {
      // Temporarily invalidate the API key to simulate an error
      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'invalid-key';
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'test topic',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      // Restore the key
      process.env.OPENAI_API_KEY = originalKey;
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      console.log('Error response:', response.body);
    }, 10000);
  });
  
  describe('Real AI Performance', () => {
    test('should complete real AI requests within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/ai/generate-content')
        .send({
          topic: 'blockchain technology',
          platform: PLATFORMS.INSTAGRAM,
          tone: TONES.CASUAL
        });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`Real AI request completed in ${duration}ms`);
    }, 15000);
    
    test('should handle concurrent real AI requests', async () => {
      const requests = Array(3).fill().map((_, index) =>
        request(app)
          .post('/ai/generate-content')
          .send({
            topic: `concurrent test ${index + 1}`,
            platform: PLATFORMS.INSTAGRAM,
            tone: TONES.CASUAL
          })
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        console.log(`Concurrent request ${index + 1}: ${response.body.data.title}`);
      });
      
      expect(totalDuration).toBeLessThan(20000); // All should complete within 20 seconds
      console.log(`Concurrent requests completed in ${totalDuration}ms`);
    }, 25000);
  });
});
