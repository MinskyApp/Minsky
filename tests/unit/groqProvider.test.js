/**
 * Unit tests for Groq Provider
 */

const GroqProvider = require('../../src/providers/groq');
const config = require('../../src/config');

// Mock the Groq module
jest.mock('groq-sdk');

describe('GroqProvider - Unit Tests', () => {
  let provider;
  let mockGroq;
  let mockClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Delete environment variable first
    delete process.env.GROQ_API_KEY;
    
    // Set environment variable for testing
    process.env.GROQ_API_KEY = 'test-key-valid-format';
    
    // Get the mocked Groq constructor
    mockGroq = require('groq-sdk');
    mockClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      },
      models: {
        list: jest.fn()
      }
    };
    
    // Mock the constructor to return our mock client
    mockGroq.mockImplementation(() => mockClient);
    
    provider = new GroqProvider();
  });
  
  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  describe('Constructor', () => {
    test('should initialize with correct configuration', () => {
      expect(mockGroq).toHaveBeenCalledWith({
        apiKey: 'test-key'
      });
      expect(provider.model).toBe('llama3-70b-8192');
      expect(provider.maxTokens).toBe(1000);
      expect(provider.temperature).toBe(0.7);
    });

    test('should throw error if API key is missing', () => {
      delete process.env.GROQ_API_KEY;
      
      // Debug: Check what's in the config
      const config = require('../../src/config');
      console.log('Config GROQ_API_KEY:', config.GROQ_API_KEY);
      console.log('Process env GROQ_API_KEY:', process.env.GROQ_API_KEY);
      
      expect(() => new GroqProvider()).toThrow('GROQ_API_KEY is not defined or invalid');
      
      // Restore for other tests
      process.env.GROQ_API_KEY = 'test-key-valid-format';
    });
  });

  describe('generateContent', () => {
    test('should generate content successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test Content',
              post: 'Test post content',
              hashtags: ['test', 'content', 'generation'],
              type: 'post',
              visualIdea: 'Test visual idea'
            })
          }
        }]
      };
      
      mockClient.chat.completions.create.mockResolvedValue(mockResponse);
      
      const prompt = 'Generate content about web development';
      const result = await provider.generateContent(prompt);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator for a tech education brand. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });
      
      expect(result).toBe(JSON.stringify({
        title: 'Test Content',
        post: 'Test post content',
        hashtags: ['test', 'content', 'generation'],
        type: 'post',
        visualIdea: 'Test visual idea'
      }));
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error');
      apiError.status = 400;
      apiError.code = 'invalid_request';
      
      mockClient.chat.completions.create.mockRejectedValue(apiError);
      
      await expect(provider.generateContent('test prompt'))
        .rejects.toThrow('AI Provider Error: API Error');
    });

    test('should handle empty response', async () => {
      const mockResponse = {
        choices: []
      };
      
      mockClient.chat.completions.create.mockResolvedValue(mockResponse);
      
      await expect(provider.generateContent('test prompt'))
        .rejects.toThrow('AI Provider Error: No content received from Groq');
    });

    test('should handle null response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      };
      
      mockClient.chat.completions.create.mockResolvedValue(mockResponse);
      
      await expect(provider.generateContent('test prompt'))
        .rejects.toThrow('AI Provider Error: No content received from Groq');
    });
  });

  describe('healthCheck', () => {
    test('should return true when health check passes', async () => {
      mockClient.models.list.mockResolvedValue({ data: [] });
      
      const result = await provider.healthCheck();
      
      expect(result).toBe(true);
      expect(mockClient.models.list).toHaveBeenCalled();
    });

    test('should return false when health check fails', async () => {
      const healthError = new Error('Health check failed');
      mockClient.models.list.mockRejectedValue(healthError);
      
      const result = await provider.healthCheck();
      
      expect(result).toBe(false);
      expect(mockClient.models.list).toHaveBeenCalled();
    });
  });
});
