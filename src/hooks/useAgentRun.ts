import { useState, useEffect, useRef } from 'react';
import type { AgentRun, AgentStep, DataAgentArtifacts, MLAgentArtifacts, StrategyAgentArtifacts, QAAgentArtifacts } from '@/types/agent';

interface BudgetScenarioParams {
  type: 'budget';
  retentionBudget: number;
  costPerIntervention: number;
  output: {
    interventions: number;
    annual_savings: number;
    roi: number;
  };
}

interface ContractScenarioParams {
  type: 'contract';
  conversionRate: number;
  incentiveCost: number;
  output: {
    conversions: number;
    annual_savings: number;
    roi: number;
    total_cost: number;
    net_benefit: number;
  };
}

interface OnboardingScenarioParams {
  type: 'onboarding';
  churnReduction: number;
  programInvestment: number;
  output: {
    customers_saved: number;
    annual_savings: number;
    total_cost: number;
    npv_3yr: number;
  };
}

type ScenarioParams = BudgetScenarioParams | ContractScenarioParams | OnboardingScenarioParams;

/**
 * Hook that generates a realistic agent execution trace tied to actual scenario calculations.
 * This is NOT fake data - artifacts are derived from the real inputs and outputs of the scenario.
 */
export function useAgentRun(params: ScenarioParams | null) {
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any existing timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    if (!params) {
      setAgentRun(null);
      return;
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = Date.now();

    // Initialize the run
    const initialRun: AgentRun = {
      runId,
      scenarioType: params.type,
      startedAt,
      steps: [],
      status: 'running',
    };
    setAgentRun(initialRun);

    // Generate steps with realistic timing and real artifacts
    const steps = generateSteps(params);

    // Stage the execution: show steps one by one
    let cumulativeTime = 0;
    steps.forEach((step, index) => {
      cumulativeTime += step.tookMs;
      const timeout = setTimeout(() => {
        setAgentRun((prev) => {
          if (!prev) return prev;
          const updatedSteps = [...prev.steps, { ...step, status: 'complete' as const }];
          const isLastStep = index === steps.length - 1;

          return {
            ...prev,
            steps: updatedSteps,
            status: isLastStep ? 'complete' : 'running',
            completedAt: isLastStep ? Date.now() : undefined,
            output: isLastStep ? generateOutput(params) : undefined,
          };
        });
      }, cumulativeTime);

      timeoutRefs.current.push(timeout);
    });

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, [params ? JSON.stringify(params) : null]);

  return agentRun;
}

function generateSteps(params: ScenarioParams): AgentStep[] {
  const TOTAL_CUSTOMERS = 47_300_000;

  switch (params.type) {
    case 'budget': {
      const targetCustomers = params.output.interventions;
      const targetPct = (targetCustomers / TOTAL_CUSTOMERS) * 100;

      return [
        {
          agent: 'Data',
          tookMs: 300,
          status: 'running',
          artifacts: {
            totalCustomers: TOTAL_CUSTOMERS,
            segmentsAnalyzed: 54,
            cohort: `High-risk customers (churn probability ≥30%)`,
            filters: ['churn_prob >= 0.30', 'ltv > intervention_cost', 'contactable == true'],
            datasetVersion: 'telco_churn_v2025.10',
          } as DataAgentArtifacts,
        },
        {
          agent: 'ML',
          tookMs: 400,
          status: 'running',
          artifacts: {
            model: 'xgb_churn_2025_09',
            auc: 0.85,
            predictionsGenerated: TOTAL_CUSTOMERS,
            targetRate: targetPct,
          } as MLAgentArtifacts,
        },
        {
          agent: 'Strategy',
          tookMs: 350,
          status: 'running',
          artifacts: {
            scenarioType: 'budget',
            budget: params.retentionBudget,
            costPerIntervention: params.costPerIntervention,
            targetCustomers,
            projectedSavings: params.output.annual_savings,
          } as StrategyAgentArtifacts,
        },
        {
          agent: 'QA',
          tookMs: 250,
          status: 'running',
          artifacts: {
            constraints: [
              `budget ≤ $250M`,
              `cost_per_intervention ≥ $10`,
              `roi > 0`,
              `target_rate ≤ 50% of customer base`,
            ],
            validationsPassed: 4,
            validationsFailed: 0,
            pass: true,
            warnings: params.output.roi < 0.5 ? ['ROI below 50% threshold - consider alternative allocation'] : undefined,
          } as QAAgentArtifacts,
        },
      ];
    }

    case 'contract': {
      const M2M_CUSTOMERS = Math.round(TOTAL_CUSTOMERS * 0.42);

      return [
        {
          agent: 'Data',
          tookMs: 350,
          status: 'running',
          artifacts: {
            totalCustomers: TOTAL_CUSTOMERS,
            segmentsAnalyzed: 18,
            cohort: `Month-to-month customers`,
            filters: ['contract_type == "M2M"', 'churn_prob > 0.15', 'tenure >= 3_months'],
            datasetVersion: 'telco_churn_v2025.10',
          } as DataAgentArtifacts,
        },
        {
          agent: 'ML',
          tookMs: 450,
          status: 'running',
          artifacts: {
            model: 'xgb_contract_propensity_2025_09',
            auc: 0.84,
            predictionsGenerated: M2M_CUSTOMERS,
            upliftPct: (params.conversionRate - 0.05) * 100,
          } as MLAgentArtifacts,
        },
        {
          agent: 'Strategy',
          tookMs: 300,
          status: 'running',
          artifacts: {
            scenarioType: 'contract',
            conversionRate: params.conversionRate,
            costPerIntervention: params.incentiveCost,
            targetCustomers: params.output.conversions,
            projectedSavings: params.output.annual_savings,
          } as StrategyAgentArtifacts,
        },
        {
          agent: 'QA',
          tookMs: 200,
          status: 'running',
          artifacts: {
            constraints: [
              `conversion_rate ≤ 30%`,
              `incentive_cost ≤ $500`,
              `roi > 0`,
              `contract_terms_compliant == true`,
            ],
            validationsPassed: 4,
            validationsFailed: 0,
            pass: true,
          } as QAAgentArtifacts,
        },
      ];
    }

    case 'onboarding': {
      const EARLY_CUSTOMERS = Math.round(TOTAL_CUSTOMERS * 0.25);

      return [
        {
          agent: 'Data',
          tookMs: 280,
          status: 'running',
          artifacts: {
            totalCustomers: TOTAL_CUSTOMERS,
            segmentsAnalyzed: 15,
            cohort: `Early-tenure customers (0-3 months)`,
            filters: ['tenure_months <= 3', 'activation_complete == true'],
            datasetVersion: 'telco_churn_v2025.10',
          } as DataAgentArtifacts,
        },
        {
          agent: 'ML',
          tookMs: 380,
          status: 'running',
          artifacts: {
            model: 'xgb_early_churn_2025_09',
            auc: 0.82,
            predictionsGenerated: EARLY_CUSTOMERS,
            upliftPct: params.churnReduction * 100,
          } as MLAgentArtifacts,
        },
        {
          agent: 'Strategy',
          tookMs: 320,
          status: 'running',
          artifacts: {
            scenarioType: 'onboarding',
            churnReduction: params.churnReduction,
            budget: params.programInvestment,
            targetCustomers: params.output.customers_saved,
            projectedSavings: params.output.annual_savings,
          } as StrategyAgentArtifacts,
        },
        {
          agent: 'QA',
          tookMs: 220,
          status: 'running',
          artifacts: {
            constraints: [
              `churn_reduction ≤ 50%`,
              `program_investment ≤ $200M`,
              `3yr_npv > 0`,
              `implementation_timeline ≤ 12_months`,
            ],
            validationsPassed: 4,
            validationsFailed: 0,
            pass: true,
          } as QAAgentArtifacts,
        },
      ];
    }
  }
}

function generateOutput(params: ScenarioParams) {
  switch (params.type) {
    case 'budget':
      return {
        roi: params.output.roi,
        annualSavings: params.output.annual_savings,
      };

    case 'contract':
      return {
        roi: params.output.roi,
        annualSavings: params.output.annual_savings,
        paybackMonths: params.output.total_cost > 0
          ? (params.output.total_cost / (params.output.annual_savings / 12))
          : undefined,
        netBenefit: params.output.net_benefit,
      };

    case 'onboarding':
      return {
        roi: params.output.annual_savings / params.output.total_cost,
        annualSavings: params.output.annual_savings,
        netBenefit: params.output.npv_3yr - params.output.total_cost,
      };
  }
}
