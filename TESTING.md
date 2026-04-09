# Testing Guide for AI Content Generator API

This document provides comprehensive testing instructions for the AI-powered content generation backend.

## Overview

The test suite includes:
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test the complete API pipeline
- **Edge Case Tests**: Test malformed responses and unusual scenarios
- **Performance Tests**: Test response times and load handling
- **Real AI Tests**: Test with actual OpenAI API (optional)

## Test Structure

```
tests/
  unit/                    # Unit tests for individual components
    contentGenerator.test.js
    openaiProvider.test.js
  integration/             # End-to-end API tests
    api.test.js
    edgeCases.test.js
    performance.test.js
    realAI.test.js         # Real AI integration (optional)
  mocks/                   # Mock data and responses
    aiResponses.js
  utils/                   # Testing utilities
    responseValidator.js
    responseValidator.test.js
```

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories

#### Unit Tests Only
```bash
npm run test:unit
```

#### Integration Tests Only
```bash
npm run test:integration
```

#### Edge Case Tests
```bash
npm run test:edge
```

#### Performance Tests
```bash
npm run test:performance
```

#### Real AI Tests (Requires API Key)
```bash
npm run test:real
```

### Development Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode
```bash
npm run test:ci
```

## Test Categories Explained

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual components in isolation with mocked dependencies.

**Coverage**:
- Content generation service logic
- AI provider functionality
- Prompt engineering
- Input validation
- Error handling

**Key Features**:
- Fast execution (no real API calls)
- Comprehensive edge case coverage
- Mock AI responses for controlled testing

### 2. Integration Tests (`tests/integration/api.test.js`)

**Purpose**: Test the complete HTTP request/response pipeline.

**Coverage**:
- API endpoint functionality
- Request validation
- Response formatting
- Error propagation
- Basic performance

**Key Features**:
- Real HTTP requests using Supertest
- Full stack testing (controller to service)
- Input/output validation
- Error response verification

### 3. Edge Case Tests (`tests/integration/edgeCases.test.js`)

**Purpose**: Test malformed AI responses and unusual scenarios.

**Coverage**:
- Malformed JSON handling
- Invalid data types
- Unicode and encoding issues
- AI provider failures
- Resource edge cases

**Key Features**:
- Comprehensive error scenarios
- Malformed response simulation
- Security testing
- Boundary condition testing

### 4. Performance Tests (`tests/integration/performance.test.js`)

**Purpose**: Test system performance under various conditions.

**Coverage**:
- Response time validation
- Concurrent request handling
- Load testing
- Memory usage
- Resource cleanup

**Key Features**:
- Performance benchmarking
- Stress testing
- Memory leak detection
- Timeout handling

### 5. Real AI Tests (`tests/integration/realAI.test.js`)

**Purpose**: Test with actual OpenAI API integration.

**Coverage**:
- Real AI content generation
- API key authentication
- Content quality validation
- Real-world performance

**Key Features**:
- Uses provided API key
- Tests actual AI responses
- Content quality assessment
- Real API error handling

**Important**: These tests consume API credits and run only when `REAL_AI_TESTS=true`.

## Mock Data

### AI Response Mocks (`tests/mocks/aiResponses.js`)

Comprehensive collection of mock AI responses including:
- Valid responses (minimal, maximum, special characters)
- Malformed JSON
- Invalid data types
- Missing fields
- Edge cases

### Response Validator (`tests/utils/responseValidator.js`)

Utility for validating API responses:
- Structure validation
- Content constraints
- Error response validation
- Request payload validation

## Environment Setup

### Test Environment Variables

Create a `.env.test` file:
```env
NODE_ENV=test
OPENAI_API_KEY=test-key-for-mocking
LOG_LEVEL=error
MAX_TITLE_WORDS=10
MIN_HASHTAGS=8
MAX_HASHTAGS=15
MAX_POST_LENGTH=500
```

### Real AI Testing

To run real AI tests:
1. Set your API key in environment or `.env` file
2. Run with `REAL_AI_TESTS=true`:
```bash
REAL_AI_TESTS=true npm run test:real
```

## Test Data Examples

### Valid Request
```json
{
  "topic": "machine learning basics",
  "platform": "instagram",
  "tone": "casual"
}
```

### Valid Response Structure
```json
{
  "success": true,
  "data": {
    "title": "ML Made Simple",
    "post": "Learn ML basics easily!",
    "hashtags": ["ml", "ai", "tech", "coding"],
    "type": "carousel",
    "visualIdea": "Educational graphics"
  },
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "processingTime": 1250
  }
}
```

## Coverage Requirements

The test suite aims for:
- **80%+ code coverage**
- **All critical paths tested**
- **All error scenarios covered**
- **Performance benchmarks met**

## Running Tests in CI

For continuous integration:
```bash
npm run test:ci
```

This runs:
- All tests in CI mode
- Coverage reporting
- No watch mode
- Strict error handling

## Debugging Tests

### Individual Test Files
```bash
npx jest tests/unit/contentGenerator.test.js
```

### Specific Test Cases
```bash
npx jest --testNamePattern="should handle malformed JSON"
```

### Verbose Output
```bash
npx jest --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Benchmarks

### Expected Performance
- **Simple requests**: < 3 seconds
- **Complex requests**: < 5 seconds
- **Health checks**: < 1 second
- **Validation errors**: < 1 second

### Load Testing
- **Concurrent requests**: 10+ simultaneous
- **Sequential requests**: 50+ without failure
- **Memory usage**: < 50MB growth over 30 requests

## Troubleshooting

### Common Issues

1. **Test Timeout**
   - Increase timeout: `jest.setTimeout(15000)`
   - Check for infinite loops or blocking operations

2. **Mock Not Working**
   - Clear mocks: `jest.clearAllMocks()`
   - Check mock implementation

3. **Port Conflicts**
   - Use different port for test server
   - Kill existing processes

4. **API Key Issues**
   - Verify environment variables
   - Check API key validity

### Debug Commands

```bash
# Check test configuration
npx jest --showConfig

# Run with coverage
npx jest --coverage --collectCoverageFrom="src/**/*.js"

# Find unmatched tests
npx jest --findRelatedTests src/services/contentGenerator.js
```

## Best Practices

### Writing Tests
1. **Test one thing at a time**
2. **Use descriptive test names**
3. **Arrange, Act, Assert pattern**
4. **Mock external dependencies**
5. **Test both success and failure cases**

### Test Organization
1. **Group related tests**
2. **Use beforeEach/afterEach for setup**
3. **Keep tests independent**
4. **Use meaningful test data**

### Performance Testing
1. **Test realistic scenarios**
2. **Monitor resource usage**
3. **Test under load**
4. **Validate response times**

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
```

## Security Testing

The test suite includes:
- XSS attempt handling
- SQL injection prevention
- Input sanitization
- Request validation
- Error information disclosure

## Contributing

When adding new tests:
1. Follow existing patterns
2. Maintain coverage thresholds
3. Add appropriate mocks
4. Update documentation
5. Test edge cases

## Support

For testing issues:
1. Check this documentation
2. Review test logs
3. Verify environment setup
4. Check mock data validity
5. Validate API responses
