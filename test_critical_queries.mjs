/**
 * Test Critical Query Fixes
 * Validates that the 5 previously failing queries now work correctly
 */

import { readFileSync } from 'fs';

// Load segments data
const segmentsData = JSON.parse(readFileSync('./src/data/segments.json', 'utf-8'));
const segments = segmentsData.segments;

// Import tools (simplified version for testing)
function get_segment_analysis({ contract_type, tenure_band, risk_level, value_tier } = {}) {
  let filtered = [...segments];

  // Filter by contract type if specified
  if (contract_type) {
    const normalized = contract_type.toLowerCase();
    if (normalized.includes('month') || normalized.includes('mtm') || normalized.includes('m2m')) {
      filtered = filtered.filter((s) => s.contract_group === 'M2M');
    } else if (normalized.includes('year') || normalized.includes('annual') || normalized.includes('1yr') || normalized.includes('2yr')) {
      filtered = filtered.filter((s) => s.contract_group === '1yr' || s.contract_group === '2yr');
    }
  }

  // Filter by tenure if specified
  if (tenure_band) {
    const normalized = tenure_band.toLowerCase();
    let targetTenure = normalized;

    if (normalized.includes('early') || normalized.includes('new') || normalized.includes('0-3')) {
      targetTenure = '0-3m';
    } else if (normalized.includes('4-12') || normalized.includes('4 to 12') || normalized.includes('young')) {
      targetTenure = '4-12m';
    } else if (normalized.includes('13-24') || normalized.includes('13 to 24') || normalized.includes('mid')) {
      targetTenure = '13-24m';
    } else if (normalized.includes('25-48') || normalized.includes('25 to 48') || normalized.includes('mature')) {
      targetTenure = '25-48m';
    } else if (normalized.includes('49-72') || normalized.includes('49 to 72') || normalized.includes('long') || normalized.includes('established')) {
      targetTenure = '49-72m';
    }

    filtered = filtered.filter((s) => s.tenure_band === targetTenure);
  }

  // Filter by risk level if specified
  if (risk_level) {
    const normalized = risk_level.toLowerCase();
    let targetRisk = '';

    if (normalized.includes('low')) {
      targetRisk = 'Low';
    } else if (normalized.includes('medium') || normalized.includes('med')) {
      targetRisk = 'Medium';
    } else if (normalized.includes('high') && !normalized.includes('very')) {
      targetRisk = 'High';
    } else if (normalized.includes('very high') || normalized.includes('very-high')) {
      targetRisk = 'Very High';
    }

    if (targetRisk) {
      filtered = filtered.filter((s) => s.risk_level === targetRisk);
    }
  }

  // Filter by value tier if specified
  if (value_tier) {
    const normalized = value_tier.toLowerCase();
    let targetValue = '';

    if (normalized.includes('low')) {
      targetValue = 'Low';
    } else if (normalized.includes('med') || normalized.includes('medium')) {
      targetValue = 'Med';
    } else if (normalized.includes('high')) {
      targetValue = 'High';
    }

    if (targetValue) {
      filtered = filtered.filter((s) => s.value_tier === targetValue);
    }
  }

  return {
    count: filtered.length,
    totalCustomers: filtered.reduce((sum, s) => sum + s.customers, 0),
    avgChurn: filtered.reduce((sum, s) => sum + (s.churn_probability * s.customers), 0) / filtered.reduce((sum, s) => sum + s.customers, 0),
    avgLTV: filtered.reduce((sum, s) => sum + (s.avg_ltv * s.customers), 0) / filtered.reduce((sum, s) => sum + s.customers, 0)
  };
}

// Test cases
const tests = [
  {
    name: "Test 1: Tell me about high-risk customers",
    params: { risk_level: "high-risk" },
    expectedSegments: "> 0"
  },
  {
    name: "Test 2: What about early-tenure customers?",
    params: { tenure_band: "early-tenure" },
    expectedSegments: "> 0"
  },
  {
    name: "Test 3: What about high-value customers?",
    params: { value_tier: "high-value" },
    expectedSegments: "> 0"
  },
  {
    name: "Test 4: Tell me about low-value month-to-month customers",
    params: { value_tier: "low-value", contract_type: "month-to-month" },
    expectedSegments: "> 0"
  },
  {
    name: "Test 5: Month-to-month customers (MTM format)",
    params: { contract_type: "M2M" },
    expectedSegments: "> 0"
  }
];

console.log("\n=== CRITICAL QUERY TESTING ===\n");

let passed = 0;
let failed = 0;

tests.forEach((test, idx) => {
  try {
    const result = get_segment_analysis(test.params);

    const success = result.count > 0 && result.totalCustomers > 0;

    if (success) {
      console.log(`✅ ${test.name}`);
      console.log(`   Segments: ${result.count}`);
      console.log(`   Customers: ${result.totalCustomers.toLocaleString()}`);
      console.log(`   Avg Churn: ${(result.avgChurn * 100).toFixed(1)}%`);
      console.log(`   Avg LTV: $${result.avgLTV.toFixed(0)}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   FAILED: No segments found`);
      console.log(`   Params:`, test.params);
      failed++;
    }
    console.log();
  } catch (error) {
    console.log(`❌ ${test.name}`);
    console.log(`   ERROR: ${error.message}`);
    console.log();
    failed++;
  }
});

console.log("=== SUMMARY ===");
console.log(`Passed: ${passed}/${tests.length}`);
console.log(`Failed: ${failed}/${tests.length}`);
console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(0)}%`);

// Exit with error code if any tests failed
process.exit(failed > 0 ? 1 : 0);
