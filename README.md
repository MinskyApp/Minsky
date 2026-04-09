# AI Content Generator API

A production-ready, scalable API for generating AI-powered social media content for the Riwi tech education brand.

## Features

- **Clean Architecture**: Controller -> Service -> AI Provider separation
- **Platform-Specific Content**: Optimized for Instagram, LinkedIn, and TikTok
- **Tone Adaptation**: Casual, Professional, and Motivational tones
- **Robust Validation**: Input validation with detailed error messages
- **Error Handling**: Comprehensive error handling with logging
- **Health Monitoring**: Built-in health checks and monitoring
- **Production Ready**: Security, logging, and performance monitoring

## Quick Start

### Prerequisites

- Node.js 16+ 
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

5. Start the server:
```bash
npm run dev
```

## API Endpoints

### Generate Content
**POST** `/ai/generate-content`

Request body:
```json
{
  "topic": "machine learning basics",
  "platform": "instagram",
  "tone": "casual"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "ML Made Simple",
    "post": "Want to learn machine learning but don't know where to start? Here's your beginner-friendly guide to understanding the basics! #TechEducation",
    "hashtags": ["machinelearning", "tech", "education", "ai", "coding", "programming", "datascience", "riwi"],
    "type": "carousel",
    "visualIdea": "Split-screen carousel showing code on one side and visual ML diagram on the other"
  },
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "processingTime": 1250
  }
}
```

### Health Check
**GET** `/health`

Returns service health status and AI provider availability.

### API Information
**GET** `/api/info`

Returns API documentation, supported platforms, tones, and limits.

## Supported Platforms

- **Instagram**: Visual-first, carousel/reel optimized
- **LinkedIn**: Professional, data-driven content
- **TikTok**: Short-form, trend-focused content

## Supported Tones

- **Casual**: Conversational and friendly
- **Professional**: Expert and authoritative
- **Motivational**: Inspiring and uplifting

## Architecture

```
src/
 controllers/     # HTTP request handlers
 services/        # Business logic and prompt engineering
 providers/       # AI provider integrations
 middleware/      # Validation, error handling, logging
 types/          # Type definitions and constants
 utils/          # Utilities (logger, etc.)
 config/         # Configuration management
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MAX_TITLE_WORDS` | Maximum title words | `10` |
| `MIN_HASHTAGS` | Minimum hashtags | `8` |
| `MAX_HASHTAGS` | Maximum hashtags | `15` |
| `MAX_POST_LENGTH` | Maximum post length | `500` |

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: 400 with detailed field errors
- **AI Provider Errors**: 503 when AI service is unavailable
- **Programming Errors**: 500 with generic message (production)

## Logging

- **Development**: Console output with colors
- **Production**: File-based logging with rotation
- **Log Levels**: error, warn, info, debug

## Security

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Joi-based validation
- **Rate Limiting**: Ready to implement

## Performance

- **Async/Await**: Non-blocking operations
- **Connection Pooling**: Reused AI provider connections
- **Request Timing**: Performance monitoring
- **Memory Management**: Optimized resource usage

## Monitoring

Health check endpoint provides:
- Service status
- AI provider availability
- Memory usage
- Uptime statistics

## Example Usage

### Using curl

```bash
curl -X POST http://localhost:3000/ai/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "web development trends 2024",
    "platform": "linkedin",
    "tone": "professional"
  }'
```

### Using JavaScript

```javascript
const response = await fetch('http://localhost:3000/ai/generate-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'web development trends 2024',
    platform: 'linkedin',
    tone: 'professional'
  })
});

const result = await response.json();
console.log(result.data);
```

## Development

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## License

MIT License - see LICENSE file for details.
