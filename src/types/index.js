/**
 * Type definitions for the AI content generator
 */

// Supported platforms
const PLATFORMS = {
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin', 
  TIKTOK: 'tiktok'
};

// Supported tones
const TONES = {
  CASUAL: 'casual',
  PROFESSIONAL: 'professional',
  MOTIVATIONAL: 'motivational'
};

// Supported post types
const POST_TYPES = {
  REEL: 'reel',
  CAROUSEL: 'carousel',
  TWEET: 'tweet',
  STORY: 'story',
  POST: 'post'
};

module.exports = {
  PLATFORMS,
  TONES,
  POST_TYPES
};
