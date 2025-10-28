/**
 * Unit tests for AIService
 *
 * Tests core functionality including template responses and schema validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIService } from './aiService';
import { AppData } from '@/types/index';

// Mock app data for testing
const mockAppData: AppData = {
  models: [
    {
      name: 'XGBoost Ensemble',
      abbrev: 'XGB',
      auc: 0.85,
      brier: 0.15,
      average_precision: 0.82,
      training_time_seconds: 120,
      winner: true,
      rationale: 'Best overall performance'
    }
  ],
  segments: [
    {
      tenure_band: '0-3 Months',
      contract_group: 'Month-to-Month',
      value_tier: 'Low',
      customers: 2500000,
      churn_probability: 0.40,
      threshold: 0.30,
      targeted_customers: 2000000,
      targeting_rate: 0.80,
      avg_ltv: 850,
      risk_level: 'Very High',
      strategy: 'Onboarding Excellence',
      expected_roi: 0.96,
      implementation_timeline: '3-6 months'
    },
    {
      tenure_band: '3-6 Months',
      contract_group: 'Month-to-Month',
      value_tier: 'Medium',
      customers: 5000000,
      churn_probability: 0.25,
      threshold: 0.20,
      targeted_customers: 3500000,
      targeting_rate: 0.70,
      avg_ltv: 1200,
      risk_level: 'High',
      strategy: 'Budget Optimization',
      expected_roi: 1.60,
      implementation_timeline: 'Immediate'
    }
  ],
  metrics: {
    overview: {
      total_customers: 47300000,
      annual_churn_cost: 850000000,
      ai_opportunity: 450000000,
      model_auc: 0.85,
      model_name: 'XGBoost Ensemble'
    },
    calibration: {
      bins: [
        { predicted: 0.1, actual: 0.09 },
        { predicted: 0.3, actual: 0.31 },
        { predicted: 0.5, actual: 0.52 }
      ]
    },
    confusion_matrix: {
      true_positives: 120000,
      false_positives: 30000,
      true_negatives: 200000,
      false_negatives: 25000,
      labels: {
        true_positives: 'Correctly identified churners',
        false_positives: 'False alarms',
        false_negatives: 'Missed churners',
        true_negatives: 'Correctly identified retainers'
      }
    }
  },
  customers_summary: {
    total_customers: 47300000,
    by_contract: {
      'Month-to-Month': { count: 19900000, pct: 42 },
      'One Year': { count: 16600000, pct: 35 },
      'Two Year': { count: 10800000, pct: 23 }
    },
    by_tenure: {
      '0-3 Months': { count: 11800000, pct: 25 },
      '3-12 Months': { count: 15700000, pct: 33 },
      '12+ Months': { count: 19800000, pct: 42 }
    },
    by_value: {
      'Low': { count: 14200000, pct: 30 },
      'Medium': { count: 23700000, pct: 50 },
      'High': { count: 9400000, pct: 20 }
    }
  },
  risk_distribution: {
    risk_levels: [
      { level: 'Low', customers: 8100000, percentage: 17.1 },
      { level: 'Medium', customers: 22400000, percentage: 47.4 },
      { level: 'High', customers: 14300000, percentage: 30.2 },
      { level: 'Very High', customers: 2500000, percentage: 5.3 }
    ]
  },
  feature_importance: {
    features: [
      { name: 'Contract Type', importance: 0.142, interpretation: 'Month-to-month customers have 3-5x higher churn' },
      { name: 'Tenure', importance: 0.128, interpretation: 'Early-tenure customers (0-3 months) show 40% churn rates' },
      { name: 'Monthly Charges', importance: 0.115, interpretation: 'Higher charges correlate with increased churn risk' },
      { name: 'Internet Service', importance: 0.098, interpretation: 'Fiber optic customers have higher churn than DSL' },
      { name: 'Payment Method', importance: 0.087, interpretation: 'Electronic check users churn more frequently' },
      { name: 'Tech Support', importance: 0.076, interpretation: 'No tech support correlates with higher churn' },
      { name: 'Online Security', importance: 0.065, interpretation: 'Lack of security features increases churn' },
      { name: 'Total Charges', importance: 0.054, interpretation: 'Lifetime spend shows loyalty patterns' },
      { name: 'Paperless Billing', importance: 0.043, interpretation: 'Billing method affects engagement' },
      { name: 'Multiple Lines', importance: 0.032, interpretation: 'Multiple services increase stickiness' }
    ]
  }
};

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    aiService.setContext(mockAppData);
  });

  describe('Template Mode (Fallback)', () => {
    it('should handle risk distribution questions', async () => {
      const response = await aiService.ask('Show me the risk distribution');

      // Validate response structure
      expect(response.answer).toBeDefined();
      expect(response.answer.length).toBeGreaterThan(20);
      expect(response.citations).toBeDefined();
      expect(response.citations.length).toBeGreaterThanOrEqual(1);

      // Validate content mentions specific numbers
      expect(response.answer).toMatch(/\d+\.\d+M/); // Contains customer count in millions
      expect(response.answer.toLowerCase()).toContain('risk');

      // Validate chart is provided
      expect(response.chart).toBeDefined();
      expect(response.chart?.type).toBe('donut');
      expect(response.chart?.title).toContain('Risk');
      expect(response.chart?.data).toBeDefined();
      expect(response.chart?.data.length).toBe(4); // 4 risk levels
    });

    it('should handle churn driver questions', async () => {
      const response = await aiService.ask('What are the top churn drivers?');

      // Validate response structure
      expect(response.answer).toBeDefined();
      expect(response.answer.length).toBeGreaterThan(20);
      expect(response.citations).toBeDefined();
      expect(response.citations.length).toBeGreaterThanOrEqual(1);

      // Validate content mentions top driver
      expect(response.answer).toContain('Contract Type');
      expect(response.answer).toMatch(/\d+\.\d+%/); // Contains percentage

      // Validate chart is provided
      expect(response.chart).toBeDefined();
      expect(response.chart?.type).toBe('horizontal-bar');
      expect(response.chart?.title).toContain('Churn');
      expect(response.chart?.data).toBeDefined();
      expect(response.chart?.data.length).toBe(10); // Top 10 features
    });

    it('should handle ROI comparison questions', async () => {
      const response = await aiService.ask('Compare ROI across strategies');

      // Validate response structure
      expect(response.answer).toBeDefined();
      expect(response.answer.length).toBeGreaterThan(20);
      expect(response.citations).toBeDefined();
      expect(response.citations.length).toBeGreaterThanOrEqual(1);

      // Validate content mentions all three strategies
      expect(response.answer).toContain('Budget Optimization');
      expect(response.answer).toContain('Contract Conversion');
      expect(response.answer).toContain('Onboarding');
      expect(response.answer).toMatch(/160%|112%|96%/); // Contains ROI percentages

      // Validate chart is provided
      expect(response.chart).toBeDefined();
      expect(response.chart?.type).toBe('bar');
      expect(response.chart?.title).toContain('ROI');
      expect(response.chart?.data).toBeDefined();
      expect(response.chart?.data.length).toBe(3); // 3 strategies
    });

    it('should handle generic questions with helpful guidance', async () => {
      const response = await aiService.ask('Hello');

      // Validate response structure
      expect(response.answer).toBeDefined();
      expect(response.answer.length).toBeGreaterThan(20);
      expect(response.citations).toBeDefined();

      // Should provide suggestions
      expect(response.answer.toLowerCase()).toMatch(/segments|churn|strategies|drivers|risk/);
    });

    it('should return error when context not set', async () => {
      const serviceWithoutContext = new AIService();
      const response = await serviceWithoutContext.ask('Show me data');

      expect(response.answer).toContain('Knowledge base not initialized');
      expect(response.citations).toEqual(['System']);
    });
  });

  describe('Response Validation', () => {
    it('should always include required fields', async () => {
      const response = await aiService.ask('Show me risk distribution');

      // Required fields
      expect(response.answer).toBeDefined();
      expect(typeof response.answer).toBe('string');
      expect(response.answer.length).toBeGreaterThan(0);

      expect(response.citations).toBeDefined();
      expect(Array.isArray(response.citations)).toBe(true);
      expect(response.citations.length).toBeGreaterThan(0);
    });

    it('should include chart with proper structure when provided', async () => {
      const response = await aiService.ask('Show me risk distribution');

      if (response.chart) {
        expect(response.chart.type).toMatch(/bar|donut|line|horizontal-bar/);
        expect(response.chart.title).toBeDefined();
        expect(response.chart.title.length).toBeGreaterThan(0);
        expect(response.chart.data).toBeDefined();
        expect(Array.isArray(response.chart.data)).toBe(true);
      }
    });

    it('should include citations in proper format', async () => {
      const response = await aiService.ask('What are the top churn drivers?');

      expect(response.citations).toBeDefined();
      expect(Array.isArray(response.citations)).toBe(true);
      response.citations.forEach(citation => {
        expect(typeof citation).toBe('string');
        expect(citation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Grounding', () => {
    it('should use real numbers from context', async () => {
      const response = await aiService.ask('Show me risk distribution');

      // Should mention actual risk level counts
      const hasRealNumbers = /16\.8M|7\.5M|22\.4M|14\.3M|2\.5M|8\.1M/i.test(response.answer);
      expect(hasRealNumbers).toBe(true);
    });

    it('should reference specific features from data', async () => {
      const response = await aiService.ask('What are top churn drivers?');

      // Should mention actual feature names
      const mentionsFeatures = /Contract Type|Tenure|Monthly Charges/i.test(response.answer);
      expect(mentionsFeatures).toBe(true);
    });

    it('should use correct ROI percentages', async () => {
      const response = await aiService.ask('Compare ROI strategies');

      // Should mention correct ROI values
      expect(response.answer).toMatch(/160%/); // Budget Optimization
      expect(response.answer).toMatch(/112%/); // Contract Conversion
      expect(response.answer).toMatch(/96%/); // Onboarding
    });
  });
});
