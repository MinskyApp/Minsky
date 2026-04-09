/**
 * Example usage of the AI Content Generator API
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

/**
 * Example: Generate content for Instagram
 */
async function generateInstagramContent() {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'JavaScript async/await best practices',
        platform: 'instagram',
        tone: 'casual'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('=== Instagram Content Generated ===');
      console.log('Title:', result.data.title);
      console.log('Post:', result.data.post);
      console.log('Hashtags:', result.data.hashtags.join(', '));
      console.log('Type:', result.data.type);
      console.log('Visual Idea:', result.data.visualIdea);
      console.log('Processing Time:', result.metadata.processingTime, 'ms');
    } else {
      console.error('Generation failed:', result.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

/**
 * Example: Generate content for LinkedIn
 */
async function generateLinkedInContent() {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'cloud computing adoption strategies',
        platform: 'linkedin',
        tone: 'professional'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('\n=== LinkedIn Content Generated ===');
      console.log('Title:', result.data.title);
      console.log('Post:', result.data.post);
      console.log('Hashtags:', result.data.hashtags.join(', '));
      console.log('Type:', result.data.type);
      console.log('Visual Idea:', result.data.visualIdea);
    } else {
      console.error('Generation failed:', result.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

/**
 * Example: Generate content for TikTok
 */
async function generateTikTokContent() {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'coding productivity hacks',
        platform: 'tiktok',
        tone: 'motivational'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('\n=== TikTok Content Generated ===');
      console.log('Title:', result.data.title);
      console.log('Post:', result.data.post);
      console.log('Hashtags:', result.data.hashtags.join(', '));
      console.log('Type:', result.data.type);
      console.log('Visual Idea:', result.data.visualIdea);
    } else {
      console.error('Generation failed:', result.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

/**
 * Example: Check API health
 */
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    
    console.log('\n=== API Health Status ===');
    console.log('Status:', result.data.status);
    console.log('AI Service:', result.data.services.ai);
    console.log('Uptime:', Math.floor(result.data.uptime), 'seconds');
    console.log('Memory Usage:', Math.round(result.data.memory.heapUsed / 1024 / 1024), 'MB');
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

/**
 * Example: Get API information
 */
async function getApiInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/info`);
    const result = await response.json();
    
    console.log('\n=== API Information ===');
    console.log('Name:', result.data.name);
    console.log('Version:', result.data.version);
    console.log('Supported Platforms:', result.data.platforms.join(', '));
    console.log('Supported Tones:', result.data.tones.join(', '));
    console.log('Post Types:', result.data.postTypes.join(', '));
    console.log('Limits:', result.data.limits);
  } catch (error) {
    console.error('Failed to get API info:', error.message);
  }
}

/**
 * Example: Handle validation errors
 */
async function demonstrateValidationError() {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: '', // Invalid: empty topic
        platform: 'invalid-platform', // Invalid: not supported
        tone: 'invalid-tone' // Invalid: not supported
      })
    });

    const result = await response.json();
    
    console.log('\n=== Validation Error Example ===');
    console.log('Success:', result.success);
    console.log('Error:', result.error);
    console.log('Details:');
    result.details.forEach(detail => {
      console.log(`  ${detail.field}: ${detail.message}`);
    });
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Run all examples
async function runExamples() {
  console.log('AI Content Generator API - Usage Examples\n');
  
  await checkHealth();
  await getApiInfo();
  await generateInstagramContent();
  await generateLinkedInContent();
  await generateTikTokContent();
  await demonstrateValidationError();
  
  console.log('\n=== Examples Complete ===');
}

// Run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = {
  generateInstagramContent,
  generateLinkedInContent,
  generateTikTokContent,
  checkHealth,
  getApiInfo,
  demonstrateValidationError
};
