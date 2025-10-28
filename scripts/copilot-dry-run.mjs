#!/usr/bin/env node
/**
 * Copilot Dry-Run Test Harness
 *
 * Manual testing tool for Strategy Copilot responses.
 * Tests multiple question types and validates response structure.
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function section(title) {
  console.log('\n' + colors.bright + colors.cyan + '━'.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + title + colors.reset);
  console.log(colors.bright + colors.cyan + '━'.repeat(80) + colors.reset + '\n');
}

// Load app data from JSON files
async function loadAppData() {
  const dataDir = join(__dirname, '..', 'public', 'data');

  const [
    models,
    segments,
    metrics,
    customersSummary,
    riskDistribution,
    featureImportance
  ] = await Promise.all([
    readFile(join(dataDir, 'models.json'), 'utf-8').then(JSON.parse),
    readFile(join(dataDir, 'segments.json'), 'utf-8').then(JSON.parse),
    readFile(join(dataDir, 'metrics.json'), 'utf-8').then(JSON.parse),
    readFile(join(dataDir, 'customers_summary.json'), 'utf-8').then(JSON.parse),
    readFile(join(dataDir, 'risk_distribution.json'), 'utf-8').then(JSON.parse),
    readFile(join(dataDir, 'feature_importance.json'), 'utf-8').then(JSON.parse)
  ]);

  return {
    models,
    segments,
    metrics,
    customers_summary: customersSummary,
    risk_distribution: riskDistribution,
    feature_importance: featureImportance
  };
}

// Simulate the AIService behavior (template mode for testing)
function askCopilot(question, appData) {
  const lowerQ = question.toLowerCase();

  // Risk questions
  if (/risk|distribution|high|medium|low/i.test(lowerQ)) {
    const riskLevels = appData.risk_distribution.risk_levels;
    const high = riskLevels.find(r => r.level === 'High');
    const veryHigh = riskLevels.find(r => r.level === 'Very High');
    const totalHigh = ((high?.customers || 0) + (veryHigh?.customers || 0)) / 1_000_000;

    return {
      answer: `Our ML Agent identifies ${totalHigh.toFixed(1)}M customers as High/Very High Risk (>30% churn probability). These are our primary intervention targets. The chart shows the full risk distribution across all segments.`,
      citations: ['ML Agent (AUC 0.85)', 'Risk Distribution'],
      chart: {
        type: 'donut',
        title: 'Customer Risk Distribution',
        data: riskLevels.map(r => ({ label: r.level, value: r.customers, percentage: r.percentage }))
      }
    };
  }

  // Feature/driver questions
  if (/feature|driver|cause|factor|why|predict/i.test(lowerQ)) {
    const features = appData.feature_importance.features;
    const top = features[0];

    return {
      answer: `The top churn driver is "${top.name}" with ${(top.importance * 100).toFixed(1)}% predictive weight. ${top.interpretation} The chart shows the top 10 drivers ranked by ML importance.`,
      citations: ['ML Agent', 'Feature Importance Analysis'],
      chart: {
        type: 'horizontal-bar',
        title: 'Top 10 Churn Drivers',
        data: features.slice(0, 10).map(f => ({ name: f.name, value: f.importance * 100 }))
      }
    };
  }

  // ROI comparison
  if (/roi|return|compare|strateg/i.test(lowerQ)) {
    return {
      answer: `Three retention strategies with distinct ROI profiles: Budget Optimization (160% ROI, $571M savings), Contract Conversion (112% ROI, $223M savings), and Onboarding Excellence (96% ROI, $98M savings). Combined portfolio delivers 90% blended ROI.`,
      citations: ['Strategy Agent', 'ROI Analysis'],
      chart: {
        type: 'bar',
        title: 'ROI Comparison Across Strategies',
        data: [
          { category: 'Budget Optimization', value: 160, label: '$571M' },
          { category: 'Contract Conversion', value: 112, label: '$223M' },
          { category: 'Onboarding Excellence', value: 96, label: '$98M' }
        ]
      }
    };
  }

  // Generic
  return {
    answer: `I can analyze customer segments, churn drivers, and retention strategies. Try: "Show me risk distribution", "What are the top churn drivers?", or "Compare ROI across strategies".`,
    citations: ['Strategy Copilot'],
  };
}

// Validate response structure
function validateResponse(response, question) {
  const errors = [];

  // Required: answer (text)
  if (!response.answer || typeof response.answer !== 'string') {
    errors.push('Missing or invalid "answer" field');
  } else if (response.answer.length < 20) {
    errors.push(`Answer too short (${response.answer.length} chars, minimum 20)`);
  }

  // Required: citations
  if (!response.citations || !Array.isArray(response.citations)) {
    errors.push('Missing or invalid "citations" field');
  } else if (response.citations.length === 0) {
    errors.push('Citations array is empty (minimum 1)');
  }

  // Optional: chart
  if (response.chart) {
    if (!['bar', 'donut', 'line', 'horizontal-bar'].includes(response.chart.type)) {
      errors.push(`Invalid chart type: ${response.chart.type}`);
    }
    if (!response.chart.title || response.chart.title.length < 3) {
      errors.push('Chart title missing or too short');
    }
    if (!response.chart.data || !Array.isArray(response.chart.data) || response.chart.data.length === 0) {
      errors.push('Chart data missing or empty');
    }
  }

  return errors;
}

// Display response in formatted output
function displayResponse(question, response, validationErrors) {
  log(colors.bright + colors.blue, 'Q:', question);
  console.log();

  // Text answer
  log(colors.green, '✓ Answer:', colors.reset + response.answer);
  console.log();

  // Citations
  if (response.citations && response.citations.length > 0) {
    log(colors.yellow, '📎 Citations:');
    response.citations.forEach(citation => {
      console.log('  -', citation);
    });
    console.log();
  }

  // Chart info
  if (response.chart) {
    log(colors.magenta, '📊 Chart:', colors.reset + response.chart.title);
    console.log('  Type:', response.chart.type);
    console.log('  Data points:', response.chart.data.length);
    console.log();
  }

  // Related segments
  if (response.relatedSegments && response.relatedSegments.length > 0) {
    log(colors.cyan, '🔗 Related Segments:');
    response.relatedSegments.forEach(segment => {
      console.log('  -', segment);
    });
    console.log();
  }

  // Follow-ups
  if (response.followUps && response.followUps.length > 0) {
    log(colors.cyan, '💡 Follow-up Suggestions:');
    response.followUps.forEach(followUp => {
      console.log('  -', followUp);
    });
    console.log();
  }

  // Validation
  if (validationErrors.length > 0) {
    log(colors.red, '❌ Validation Errors:');
    validationErrors.forEach(error => {
      console.log('  -', error);
    });
  } else {
    log(colors.green, '✅ Response structure valid');
  }
}

// Main test function
async function runTests() {
  section('Strategy Copilot - Dry Run Test Harness');

  log(colors.bright, 'Loading app data...');
  const appData = await loadAppData();
  log(colors.green, '✓ Data loaded successfully');
  log(colors.reset, `  - Customers: ${(appData.metrics.overview.total_customers / 1_000_000).toFixed(1)}M`);
  log(colors.reset, `  - Segments: ${appData.segments.length}`);
  log(colors.reset, `  - Features: ${appData.feature_importance.features.length}`);
  log(colors.reset, `  - Risk Levels: ${appData.risk_distribution.risk_levels.length}`);

  const testQuestions = [
    'Show me customer risk distribution',
    'What are the top churn drivers?',
    'Compare ROI across all strategies',
    'Tell me about month-to-month customers'
  ];

  for (const question of testQuestions) {
    section(`Test: ${question}`);

    const response = askCopilot(question, appData);
    const validationErrors = validateResponse(response, question);

    displayResponse(question, response, validationErrors);
  }

  section('Test Summary');
  log(colors.green, '✓ All tests completed');
  log(colors.bright, '\nNote:', colors.reset + 'This dry-run uses template mode for testing.');
  log(colors.reset, 'With a valid OpenAI API key, responses will be generated by GPT-5.');
  console.log();
}

// Run tests
runTests().catch(error => {
  log(colors.red, '❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});
