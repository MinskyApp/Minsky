/**
 * Content Generation Service
 * Handles prompt engineering and content generation logic
 */

const GroqProvider = require('../providers/groq');
const config = require('../config');
const logger = require('../utils/logger');
const { PLATFORMS, TONES, POST_TYPES } = require('../types');

class ContentGeneratorService {
  constructor() {
    this.aiProvider = new GroqProvider();
  }

  /**
   * Generate social media content based on input parameters
   * @param {Object} params - Generation parameters
   * @param {string} params.topic - Content topic
   * @param {string} params.platform - Target platform
   * @param {string} params.tone - Content tone
   * @returns {Promise<Object>} - Generated content
   */
  async generateContent({ topic, platform, tone }) {
    try {
      logger.info('Starting content generation', { topic, platform, tone });

      // Validate inputs
      this.validateInputs({ topic, platform, tone });

      // Generate the prompt
      const prompt = this.buildPrompt({ topic, platform, tone });

      // Get AI response
      const aiResponse = await this.aiProvider.generateContent(prompt);

      // Parse and validate response
      const parsedContent = this.parseAndValidateResponse(aiResponse);

      logger.info('Content generated successfully', {
        title: parsedContent.title,
        type: parsedContent.type,
        hashtagsCount: parsedContent.hashtags.length
      });

      return parsedContent;
    } catch (error) {
      logger.error('Content generation failed', { 
        error: error.message,
        topic, 
        platform, 
        tone 
      });
      throw error;
    }
  }

  /**
   * Build the optimized prompt for content generation
   * @param {Object} params - Prompt parameters
   * @returns {string} - The complete prompt
   */
  buildPrompt({ topic, platform, tone }) {
    const platformGuidelines = this.getPlatformGuidelines(platform);
    const toneGuidelines = this.getToneGuidelines(tone);

    return `You are a world-class social media content creator for Riwi, a tech education brand. 

Create engaging, viral-worthy content about: "${topic}"

PLATFORM: ${platform.toUpperCase()}
${platformGuidelines}

TONE: ${tone.toUpperCase()}
${toneGuidelines}

REQUIREMENTS:
- Create content that drives engagement and shares
- Be specific, not generic - use concrete examples and data
- Include a strong hook in the first sentence
- Make it actionable and valuable for the audience
- Avoid clichés and overused phrases

RESPONSE FORMAT (JSON only):
{
  "title": "Engaging title (max ${config.MAX_TITLE_WORDS} words)",
  "post": "Full post content with hook, value, and CTA (max ${config.MAX_POST_LENGTH} chars)",
  "hashtags": ["hashtag1", "hashtag2", "..."] (${config.MIN_HASHTAGS}-${config.MAX_HASHTAGS} relevant hashtags),
  "type": "one of: ${Object.values(POST_TYPES).join(', ')}",
  "visualIdea": "Specific visual concept that matches the content"
}

IMPORTANT:
- Response must be valid JSON only
- Title must be catchy and under ${config.MAX_TITLE_WORDS} words
- Post must start with an engaging hook
- Hashtags must be relevant and trending
- Visual idea should be specific and actionable

Generate the content now:`;
  }

  /**
   * Get platform-specific guidelines
   * @param {string} platform - Target platform
   * @returns {string} - Platform guidelines
   */
  getPlatformGuidelines(platform) {
    const guidelines = {
      [PLATFORMS.INSTAGRAM]: `
- Visual-first platform
- Ideal for carousel posts, reels, and stories
- Use emojis strategically
- Focus on aesthetics and storytelling
- Call-to-action should be clear
- Hashtags are crucial for discovery`,
      
      [PLATFORMS.LINKEDIN]: `
- Professional and business-focused
- Longer-form content acceptable
- Data-driven insights perform well
- Industry terminology appropriate
- Focus on value and expertise
- Professional tone with some personality`,
      
      [PLATFORMS.TIKTOK]: `
- Short-form video content
- Trend-focused and entertaining
- Use popular sounds and formats
- High energy and engaging
- Clear call-to-action
- Educational content should be snackable`
    };

    return guidelines[platform] || guidelines[PLATFORMS.INSTAGRAM];
  }

  /**
   * Get tone-specific guidelines
   * @param {string} tone - Content tone
   * @returns {string} - Tone guidelines
   */
  getToneGuidelines(tone) {
    const guidelines = {
      [TONES.CASUAL]: `
- Conversational and friendly
- Use contractions and simple language
- Relatable and approachable
- Light humor when appropriate
- Feel like talking to a friend`,
      
      [TONES.PROFESSIONAL]: `
- Expert and authoritative
- Clear and structured
- Industry-appropriate terminology
- Data-backed claims
- Inspires confidence and trust`,
      
      [TONES.MOTIVATIONAL]: `
- Inspiring and uplifting
- Action-oriented language
- Emotional connection
- Future-focused
- Encourages growth and learning`
    };

    return guidelines[tone] || guidelines[TONES.CASUAL];
  }

  /**
   * Validate input parameters
   * @param {Object} params - Input parameters
   */
  validateInputs({ topic, platform, tone }) {
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new Error('Topic is required and must be a non-empty string');
    }

    if (topic.trim().length < 3) {
      throw new Error('Topic must be at least 3 characters long');
    }

    if (!Object.values(PLATFORMS).includes(platform)) {
      throw new Error(`Invalid platform. Must be one of: ${Object.values(PLATFORMS).join(', ')}`);
    }

    if (!Object.values(TONES).includes(tone)) {
      throw new Error(`Invalid tone. Must be one of: ${Object.values(TONES).join(', ')}`);
    }
  }

  /**
   * Parse and validate AI response
   * @param {string} aiResponse - Raw AI response
   * @returns {Object} - Parsed and validated content
   */
  parseAndValidateResponse(aiResponse) {
    try {
      // Validate response is not null/undefined
      if (aiResponse === null || aiResponse === undefined) {
        throw new Error('AI provider returned null or undefined response');
      }

      // Validate response is a string
      if (typeof aiResponse !== 'string') {
        throw new Error('AI provider returned non-string response');
      }

      // Validate response is not empty
      if (aiResponse.trim().length === 0) {
        throw new Error('AI provider returned empty response');
      }

      // Parse JSON response
      let parsed;
      try {
        parsed = JSON.parse(aiResponse);
      } catch (parseError) {
        throw new Error('Invalid JSON response from AI provider');
      }

      // Validate parsed object is not null
      if (parsed === null || parsed === undefined) {
        throw new Error('AI provider returned null JSON object');
      }

      // Validate required fields
      const requiredFields = ['title', 'post', 'hashtags', 'type', 'visualIdea'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate field types
      if (typeof parsed.title !== 'string') {
        throw new Error('Title must be a string');
      }

      if (typeof parsed.post !== 'string') {
        throw new Error('Post must be a string');
      }

      if (typeof parsed.visualIdea !== 'string') {
        throw new Error('Visual idea must be a string');
      }

      if (typeof parsed.type !== 'string') {
        throw new Error('Type must be a string');
      }

      // Validate field constraints
      if (parsed.title.trim().length === 0) {
        throw new Error('Title cannot be empty');
      }

      if (parsed.post.trim().length === 0) {
        throw new Error('Post cannot be empty');
      }

      if (parsed.visualIdea.trim().length === 0) {
        throw new Error('Visual idea cannot be empty');
      }

      if (parsed.title.split(' ').length > config.MAX_TITLE_WORDS) {
        throw new Error(`Title exceeds maximum word count of ${config.MAX_TITLE_WORDS}`);
      }

      if (!Array.isArray(parsed.hashtags) || 
          parsed.hashtags.length < config.MIN_HASHTAGS || 
          parsed.hashtags.length > config.MAX_HASHTAGS) {
        throw new Error(`Hashtags must be an array with ${config.MIN_HASHTAGS}-${config.MAX_HASHTAGS} items`);
      }

      // Validate hashtag types and non-empty
      const nonStringHashtags = parsed.hashtags.filter(tag => typeof tag !== 'string');
      if (nonStringHashtags.length > 0) {
        throw new Error('All hashtags must be strings');
      }

      const emptyHashtags = parsed.hashtags.filter(tag => !tag || tag.trim().length === 0);
      if (emptyHashtags.length > 0) {
        throw new Error('Hashtags cannot be empty');
      }

      // Check for duplicate hashtags (case-insensitive)
      const normalizedHashtags = parsed.hashtags.map(tag => tag.toLowerCase().trim());
      const uniqueHashtags = [...new Set(normalizedHashtags)];
      if (uniqueHashtags.length !== normalizedHashtags.length) {
        throw new Error('Hashtags must be unique (case-insensitive)');
      }

      if (!Object.values(POST_TYPES).includes(parsed.type)) {
        throw new Error(`Invalid post type. Must be one of: ${Object.values(POST_TYPES).join(', ')}`);
      }

      if (parsed.post.length > config.MAX_POST_LENGTH) {
        throw new Error(`Post exceeds maximum length of ${config.MAX_POST_LENGTH} characters`);
      }

      return {
        title: parsed.title.trim(),
        post: parsed.post.trim(),
        hashtags: parsed.hashtags.map(tag => tag.trim().replace('#', '')),
        type: parsed.type,
        visualIdea: parsed.visualIdea.trim()
      };
    } catch (error) {
      // Re-throw validation errors as-is
      if (error.message.includes('AI provider') || 
          error.message.includes('Missing required fields') ||
          error.message.includes('must be') ||
          error.message.includes('cannot be empty') ||
          error.message.includes('exceeds maximum')) {
        throw error;
      }
      
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON response from AI provider');
      }
      
      // Handle other unexpected errors
      throw new Error(`Unexpected error processing AI response: ${error.message}`);
    }
  }

  /**
   * Get fallback content if AI generation fails
   * @param {Object} params - Original parameters
   * @returns {Object} - Fallback content
   */
  getFallbackContent({ topic, platform, tone }) {
    logger.warn('Using fallback content', { topic, platform, tone });

    return {
      title: `${topic} - Tech Insights`,
      post: `Discover the latest insights about ${topic}. Stay tuned for more tech education content from Riwi!`,
      hashtags: ['tech', 'education', 'learning', 'riwi', 'innovation'],
      type: POST_TYPES.POST,
      visualIdea: 'Clean typography with tech-inspired graphics'
    };
  }
}

module.exports = ContentGeneratorService;
