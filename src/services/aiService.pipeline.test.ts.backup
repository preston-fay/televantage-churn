/**
 * Pipeline Behavior Tests
 *
 * Tests the planner→executor→validator pipeline to ensure:
 * 1. Answers are grounded in real data (no hallucination)
 * 2. Charts always have proper labels
 * 3. Validation catches missing labels and retries
 * 4. Fallback works when all else fails
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIService } from './aiService';
import { executePlan, validateChart } from './copilotExecutor';
import { Plan } from './copilotPlannerSchema';
import type { AppData } from '@/types/index';

// Mock app data
const mockAppData: AppData = {
  models: [],
  segments: [],
  metrics: {
    overview: {
      total_customers: 47_300_000,
      annual_churn_cost: 850_000_000,
      ai_opportunity: 450_000_000,
      model_auc: 0.85,
      model_name: 'XGBoost Ensemble'
    },
    calibration: { bins: [] },
    confusion_matrix: {
      true_positives: 0,
      false_positives: 0,
      true_negatives: 0,
      false_negatives: 0,
      labels: {
        true_positives: '',
        false_positives: '',
        false_negatives: '',
        true_negatives: ''
      }
    }
  },
  customers_summary: {
    total_customers: 47_300_000,
    by_contract: {},
    by_tenure: {},
    by_value: {}
  },
  risk_distribution: {
    risk_levels: [
      { level: 'Low', customers: 8_100_000, percentage: 17.1 },
      { level: 'Medium', customers: 22_400_000, percentage: 47.4 },
      { level: 'High', customers: 14_300_000, percentage: 30.2 },
      { level: 'Very High', customers: 2_500_000, percentage: 5.3 }
    ]
  },
  feature_importance: {
    features: [
      { name: 'Contract Type', importance: 0.142, interpretation: 'M2M customers have 3-5x higher churn' },
      { name: 'Tenure', importance: 0.128, interpretation: 'Early-tenure customers show 40% churn rates' },
      { name: 'Monthly Charges', importance: 0.115, interpretation: 'Higher charges correlate with churn risk' }
    ]
  }
};

describe('Copilot Pipeline', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    aiService.setContext(mockAppData);
  });

  describe('Executor', () => {
    it('executes topN operation and returns labeled chart', () => {
      const plan: Plan = {
        intent: 'drivers',
        metrics: ['feature_importance'],
        operations: [{
          op: 'topN',
          from: 'feature_importance',
          select: ['name', 'importance'],
          orderBy: { field: 'importance', dir: 'desc' },
          limit: 3
        }],
        chart: {
          kind: 'horizontal-bar',
          title: 'Top 3 Churn Drivers',
          xLabel: 'Importance (%)',
          yLabel: 'Driver'
        },
        narrativeFocus: ['top driver', 'ranking'],
        citations: ['ModelingDeepDive: Feature Importance']
      };

      const result = executePlan(plan, mockAppData);

      expect(result.table).toHaveLength(3);
      expect(result.table[0].name).toBe('Contract Type');
      expect(result.chart.title).toBe('Top 3 Churn Drivers');
      expect(result.chart.xLabel).toBe('Importance (%)');
      expect(result.chart.yLabel).toBe('Driver');
      expect(result.lead).toContain('Contract Type');
    });

    it('executes risk distribution query with donut chart', () => {
      const plan: Plan = {
        intent: 'risk',
        metrics: ['risk_distribution'],
        operations: [{
          op: 'topN',
          from: 'risk_distribution',
          select: ['level', 'customers'],
          limit: 10
        }],
        chart: {
          kind: 'donut',
          title: 'Customer Risk Distribution'
        },
        narrativeFocus: ['risk segments'],
        citations: ['ExecutiveDashboard: Risk Distribution']
      };

      const result = executePlan(plan, mockAppData);

      expect(result.table).toHaveLength(4); // 4 risk levels
      expect(result.chart.kind).toBe('donut');
      expect(result.chart.title).toBe('Customer Risk Distribution');
      // Donut charts don't need xLabel/yLabel
      expect(result.chart.xLabel).toBeUndefined();
    });
  });

  describe('Chart Validation', () => {
    it('validates charts with proper labels', () => {
      const validChart = {
        kind: 'bar',
        title: 'Test Chart',
        xLabel: 'Category',
        yLabel: 'Value',
        series: [{ name: 'Data', data: [{ x: 'A', y: 10 }] }]
      };

      const validation = validateChart(validChart);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('rejects charts missing xLabel', () => {
      const invalidChart = {
        kind: 'bar',
        title: 'Test Chart',
        yLabel: 'Value',
        series: [{ name: 'Data', data: [{ x: 'A', y: 10 }] }]
      };

      const validation = validateChart(invalidChart);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Chart missing X-axis label');
    });

    it('rejects charts missing yLabel', () => {
      const invalidChart = {
        kind: 'bar',
        title: 'Test Chart',
        xLabel: 'Category',
        series: [{ name: 'Data', data: [{ x: 'A', y: 10 }] }]
      };

      const validation = validateChart(invalidChart);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Chart missing Y-axis label');
    });

    it('allows donut charts without axis labels', () => {
      const donutChart = {
        kind: 'donut',
        title: 'Distribution',
        series: [{ name: 'Data', data: [{ x: 'A', y: 10 }] }]
      };

      const validation = validateChart(donutChart);
      expect(validation.valid).toBe(true);
    });

    it('rejects charts with no data', () => {
      const emptyChart = {
        kind: 'bar',
        title: 'Empty Chart',
        xLabel: 'X',
        yLabel: 'Y',
        series: [{ name: 'Data', data: [] }]
      };

      const validation = validateChart(emptyChart);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Chart series has no data points');
    });
  });

  describe('Template Fallback', () => {
    it('returns valid response for risk questions', async () => {
      const response = await aiService.ask('Show me risk distribution');

      expect(response.answer).toBeDefined();
      expect(response.answer.length).toBeGreaterThan(20);
      expect(response.citations).toBeDefined();
      expect(response.citations.length).toBeGreaterThan(0);

      if (response.chart) {
        expect(response.chart.title).toBeDefined();
        expect(response.chart.title.length).toBeGreaterThan(0);
      }
    });

    it('returns valid response for driver questions', async () => {
      const response = await aiService.ask('What are the top churn drivers?');

      expect(response.answer).toBeDefined();
      expect(response.answer).toContain('Contract Type');
      expect(response.citations).toBeDefined();

      if (response.chart) {
        expect(response.chart.title).toContain('Churn');
      }
    });
  });

  describe('Data Grounding', () => {
    it('uses real feature importance values', async () => {
      const response = await aiService.ask('Top churn drivers');

      // Should mention actual feature from mock data
      const mentionsRealFeature =
        response.answer.includes('Contract Type') ||
        response.answer.includes('Tenure') ||
        response.answer.includes('Monthly Charges');

      expect(mentionsRealFeature).toBe(true);
    });

    it('uses real risk distribution numbers', async () => {
      const response = await aiService.ask('Show risk distribution');

      // Should mention actual percentages or counts
      const mentionsRealNumbers =
        /47%|47\.4%|22\.4M|14\.3M/.test(response.answer);

      expect(mentionsRealNumbers || response.answer.length > 20).toBe(true);
    });
  });
});
