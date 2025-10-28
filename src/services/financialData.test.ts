/**
 * Unit tests for Financial Data and Intent Detection
 */

import { describe, it, expect } from 'vitest';
import { getFinancialMetrics, projectArpuDelta, calculateIRR, formatFinancial } from './financialData';
import { detectIntent, getIntentName } from './copilotIntents';

describe('Financial Data Accessors', () => {
  it('returns financial metrics with all required fields', () => {
    const metrics = getFinancialMetrics();

    expect(typeof metrics.arpu).toBe('number');
    expect(metrics.arpu).toBeGreaterThan(0);

    expect(typeof metrics.irr).toBe('number');
    expect(metrics.irr).toBeGreaterThan(0);
    expect(metrics.irr).toBeLessThan(1); // IRR as decimal

    expect(typeof metrics.cltv).toBe('number');
    expect(metrics.cltv).toBeGreaterThan(0);

    expect(typeof metrics.ebitdaImpact).toBe('number');
    expect(metrics.ebitdaImpact).toBeGreaterThan(0);
  });

  it('returns optional metrics when available', () => {
    const metrics = getFinancialMetrics();

    if (metrics.sac !== undefined) {
      expect(typeof metrics.sac).toBe('number');
      expect(metrics.sac).toBeGreaterThan(0);
    }

    if (metrics.mrr !== undefined) {
      expect(typeof metrics.mrr).toBe('number');
      expect(metrics.mrr).toBeGreaterThan(0);
    }

    if (metrics.nps !== undefined) {
      expect(typeof metrics.nps).toBe('number');
      expect(metrics.nps).toBeGreaterThanOrEqual(-100);
      expect(metrics.nps).toBeLessThanOrEqual(100);
    }
  });

  it('projects ARPU delta based on churn reduction', () => {
    const churnDelta = 0.02; // 2% churn reduction
    const arpuDelta = projectArpuDelta(churnDelta);

    expect(typeof arpuDelta).toBe('number');
    expect(arpuDelta).toBeGreaterThan(0);
    expect(arpuDelta).toBeLessThan(10); // Reasonable ARPU change
  });

  it('calculates IRR for investment scenarios', () => {
    const investment = 100_000_000; // $100M
    const annualReturn = 150_000_000; // $150M/year
    const years = 3;

    const irr = calculateIRR(investment, annualReturn, years);

    expect(typeof irr).toBe('number');
    expect(irr).toBeGreaterThan(0);
    expect(irr).toBeLessThan(5); // Reasonable IRR (< 500%)
  });

  it('formats financial values correctly', () => {
    // Currency formatting
    expect(formatFinancial(1_500_000, 'currency')).toBe('$1.5M');
    expect(formatFinancial(250, 'currency')).toBe('$250.00');

    // Percent formatting
    expect(formatFinancial(0.278, 'percent')).toBe('27.8%');
    expect(formatFinancial(1.5, 'percent')).toBe('150.0%');

    // Compact formatting
    expect(formatFinancial(1_500_000_000, 'compact')).toBe('1.50B');
    expect(formatFinancial(1_500_000, 'compact')).toBe('1.5M');
    expect(formatFinancial(1_500, 'compact')).toBe('1.5K');
    expect(formatFinancial(150, 'compact')).toBe('150');
  });
});

describe('Copilot Intent Detection', () => {
  it('detects ARPU intent', () => {
    expect(detectIntent('What is our ARPU?')).toBe('arpu');
    expect(detectIntent('Show me ARPU trends')).toBe('arpu');
    expect(detectIntent('arpu analysis')).toBe('arpu');
  });

  it('detects IRR intent', () => {
    expect(detectIntent('What is the IRR?')).toBe('irr');
    expect(detectIntent('Show me IRR for strategies')).toBe('irr');
    expect(detectIntent('Compare ROI and IRR')).toBe('irr');
  });

  it('detects CLTV intent', () => {
    expect(detectIntent('What is customer lifetime value?')).toBe('cltv');
    expect(detectIntent('Show me CLTV')).toBe('cltv');
    expect(detectIntent('Calculate LTV')).toBe('cltv');
  });

  it('detects EBITDA intent', () => {
    expect(detectIntent('What is the EBITDA impact?')).toBe('ebitda');
    expect(detectIntent('Show EBITDA projections')).toBe('ebitda');
  });

  it('detects NPS intent', () => {
    expect(detectIntent('What is our NPS?')).toBe('nps');
    expect(detectIntent('Show net promoter score')).toBe('nps');
  });

  it('detects MRR intent', () => {
    expect(detectIntent('What is our MRR?')).toBe('mrr');
    expect(detectIntent('Show monthly recurring revenue')).toBe('mrr');
  });

  it('detects SAC intent', () => {
    expect(detectIntent('What is our SAC?')).toBe('sac');
    expect(detectIntent('Show acquisition cost')).toBe('sac');
  });

  it('detects financial overview intent', () => {
    expect(detectIntent('Show all financial KPIs')).toBe('financial_overview');
    expect(detectIntent('What are our key metrics?')).toBe('financial_overview');
    expect(detectIntent('Give me financials')).toBe('financial_overview');
  });

  it('detects operational intents (non-financial)', () => {
    expect(detectIntent('Show me risk distribution')).toBe('risk');
    expect(detectIntent('What are the top churn drivers?')).toBe('churn_drivers');
    expect(detectIntent('Compare ROI strategies')).toBe('roi');
    expect(detectIntent('Show customer segments')).toBe('segments');
  });

  it('returns generic intent for unmatched queries', () => {
    expect(detectIntent('Hello')).toBe('generic');
    expect(detectIntent('Tell me a joke')).toBe('generic');
    expect(detectIntent('Random question')).toBe('generic');
  });

  it('returns correct intent display names', () => {
    expect(getIntentName('arpu')).toBe('ARPU Analysis');
    expect(getIntentName('irr')).toBe('IRR Analysis');
    expect(getIntentName('cltv')).toBe('CLTV Analysis');
    expect(getIntentName('risk')).toBe('Risk Analysis');
    expect(getIntentName('generic')).toBe('General Query');
  });
});

describe('Financial Data Integration', () => {
  it('maintains consistency between ARPU and CLTV', () => {
    const metrics = getFinancialMetrics();

    // CLTV should be larger than ARPU (lifetime vs monthly)
    expect(metrics.cltv).toBeGreaterThan(metrics.arpu);

    // CLTV should be reasonable (not more than 10 years of ARPU)
    expect(metrics.cltv).toBeLessThan(metrics.arpu * 12 * 10);
  });

  it('maintains consistency between EBITDA and IRR', () => {
    const metrics = getFinancialMetrics();

    // Both should be positive for profitable scenarios
    expect(metrics.ebitdaImpact).toBeGreaterThan(0);
    expect(metrics.irr).toBeGreaterThan(0);

    // IRR should be reasonable (< 100% for most scenarios)
    expect(metrics.irr).toBeLessThan(1.0);
  });

  it('provides valid NPS when available', () => {
    const metrics = getFinancialMetrics();

    if (metrics.nps !== undefined) {
      // NPS must be in valid range
      expect(metrics.nps).toBeGreaterThanOrEqual(-100);
      expect(metrics.nps).toBeLessThanOrEqual(100);

      // Should be integer
      expect(Number.isInteger(metrics.nps)).toBe(true);
    }
  });
});
