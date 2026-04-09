/**
 * Test runner script with enhanced reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}`, 'cyan');
  log('='.repeat(50), 'cyan');
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function checkEnvironment() {
  log('Checking test environment...', 'yellow');
  
  // Check if node_modules exists
  if (!fs.existsSync(path.join(__dirname, '../node_modules'))) {
    log('ERROR: node_modules not found. Run "npm install" first.', 'red');
    process.exit(1);
  }
  
  // Check if Jest is available
  try {
    execSync('npx jest --version', { stdio: 'ignore' });
  } catch (error) {
    log('ERROR: Jest not found. Check your installation.', 'red');
    process.exit(1);
  }
  
  log('Environment check passed!', 'green');
}

function showMenu() {
  log('\n' + '='.repeat(60), 'bright');
  log('AI Content Generator - Test Runner', 'bright');
  log('='.repeat(60), 'bright');
  
  log('\nAvailable test options:', 'yellow');
  log('1. Run all tests', 'white');
  log('2. Run unit tests only', 'white');
  log('3. Run integration tests only', 'white');
  log('4. Run edge case tests', 'white');
  log('5. Run performance tests', 'white');
  log('6. Run real AI tests (requires API key)', 'white');
  log('7. Run tests with coverage', 'white');
  log('8. Run tests in watch mode', 'white');
  log('9. Run CI tests', 'white');
  log('10. Quick validation (unit + basic integration)', 'white');
  log('0. Exit', 'white');
  
  log('\nEnvironment variables:', 'yellow');
  log('- REAL_AI_TESTS=true: Enable real AI testing', 'white');
  log('- OPENAI_API_KEY: Your OpenAI API key', 'white');
}

function runQuickValidation() {
  log('Running quick validation...', 'cyan');
  
  const results = [];
  
  // Unit tests
  const unitResult = runCommand('npm run test:unit', 'Unit Tests');
  results.push({ type: 'Unit', ...unitResult });
  
  // Basic integration tests
  const integrationResult = runCommand('npm run test:integration', 'Integration Tests');
  results.push({ type: 'Integration', ...integrationResult });
  
  // Summary
  log('\n' + '='.repeat(50), 'bright');
  log('Quick Validation Summary', 'bright');
  log('='.repeat(50), 'bright');
  
  let allPassed = true;
  results.forEach(result => {
    const status = result.success ? 'PASS' : 'FAIL';
    const color = result.success ? 'green' : 'red';
    log(`${result.type} Tests: ${status}`, color);
    if (!result.success) {
      allPassed = false;
    }
  });
  
  if (allPassed) {
    log('\nAll tests passed! Ready for deployment.', 'green');
  } else {
    log('\nSome tests failed. Please review the errors above.', 'red');
  }
  
  return allPassed;
}

function runRealAITests() {
  // Check for API key
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'test-key') {
    log('WARNING: No valid Groq API key found.', 'yellow');
    log('Set GROQ_API_KEY environment variable to run real AI tests.', 'yellow');
    log('Using provided API key for this session...', 'yellow');
    
    // Set the provided API key temporarily
    process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test_key';
  }
  
  log('Running real AI integration tests...', 'cyan');
  log('NOTE: These tests consume API credits and may take longer.', 'yellow');
  
  const result = runCommand('npm run test:real', 'Real AI Tests');
  
  if (result.success) {
    log('Real AI tests completed successfully!', 'green');
  } else {
    log('Real AI tests failed. Check API key and connection.', 'red');
  }
}

function main() {
  checkEnvironment();
  
  // If command line argument provided, run directly
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'unit':
        runCommand('npm run test:unit', 'Unit Tests');
        break;
      case 'integration':
        runCommand('npm run test:integration', 'Integration Tests');
        break;
      case 'edge':
        runCommand('npm run test:edge', 'Edge Case Tests');
        break;
      case 'performance':
        runCommand('npm run test:performance', 'Performance Tests');
        break;
      case 'real':
        runRealAITests();
        break;
      case 'coverage':
        runCommand('npm run test:coverage', 'Coverage Report');
        break;
      case 'watch':
        runCommand('npm run test:watch', 'Watch Mode');
        break;
      case 'ci':
        runCommand('npm run test:ci', 'CI Tests');
        break;
      case 'quick':
        runQuickValidation();
        break;
      case 'all':
        runCommand('npm test', 'All Tests');
        break;
      default:
        log(`Unknown command: ${command}`, 'red');
        showMenu();
        break;
    }
    return;
  }
  
  // Interactive mode
  showMenu();
  
  // For now, just run quick validation by default
  // In a real implementation, you'd add readline for interactive input
  log('\nRunning quick validation by default...', 'cyan');
  log('Use arguments for specific tests: node runTests.js [unit|integration|edge|performance|real|coverage|watch|ci|quick|all]', 'yellow');
  
  runQuickValidation();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught error: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run the test runner
if (require.main === module) {
  main();
}

module.exports = {
  runCommand,
  checkEnvironment,
  runQuickValidation,
  runRealAITests
};
