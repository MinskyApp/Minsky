/**
 * Content Generation Controller
 * Handles HTTP requests for content generation
 */

const ContentGeneratorService = require('../services/contentGenerator');
const { catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ContentController {
  constructor() {
    this.contentService = new ContentGeneratorService();
  }

  /**
   * Generate social media content
   * POST /ai/generate-content
   */
  generateContent = catchAsync(async (req, res) => {
    const { topic, platform, tone } = req.body;

    logger.info('Content generation request received', {
      topic,
      platform,
      tone,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate content using the service
    const content = await this.contentService.generateContent({
      topic,
      platform,
      tone
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: content,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - req.startTime
      }
    });
  });

  /**
   * Health check endpoint
   * GET /health
   */
  healthCheck = catchAsync(async (req, res) => {
    const isHealthy = await this.contentService.aiProvider.healthCheck();

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        ai: isHealthy ? 'available' : 'unavailable'
      }
    };

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: healthStatus
    });
  });

  /**
   * Get API information
   * GET /api/info
   */
  getApiInfo = catchAsync(async (req, res) => {
    const { PLATFORMS, TONES, POST_TYPES } = require('../types');

    res.status(200).json({
      success: true,
      data: {
        name: 'AI Content Generator API',
        version: '1.0.0',
        description: 'AI-powered social media content generation platform',
        endpoints: {
          generate: 'POST /ai/generate-content',
          health: 'GET /health',
          info: 'GET /api/info'
        },
        platforms: Object.values(PLATFORMS),
        tones: Object.values(TONES),
        postTypes: Object.values(POST_TYPES),
        limits: {
          maxTitleWords: parseInt(process.env.MAX_TITLE_WORDS) || 10,
          minHashtags: parseInt(process.env.MIN_HASHTAGS) || 8,
          maxHashtags: parseInt(process.env.MAX_HASHTAGS) || 15,
          maxPostLength: parseInt(process.env.MAX_POST_LENGTH) || 500
        }
      }
    });
  });
}

module.exports = ContentController;
