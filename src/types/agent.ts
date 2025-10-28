/**
 * Agent Execution Trace Types
 *
 * These types capture the actual artifacts and execution trace of the multi-agent
 * analytics pipeline, tied directly to scenario calculations.
 */

export type AgentName = 'Data' | 'ML' | 'Strategy' | 'QA';

export interface DataAgentArtifacts {
  totalCustomers: number;
  segmentsAnalyzed: number;
  cohort: string;
  filters: string[];
  datasetVersion: string;
}

export interface MLAgentArtifacts {
  model: string;
  auc: number;
  predictionsGenerated: number;
  upliftPct?: number;
  targetRate?: number;
}

export interface StrategyAgentArtifacts {
  scenarioType: 'budget' | 'contract' | 'onboarding';
  budget?: number;
  conversionRate?: number;
  churnReduction?: number;
  costPerIntervention?: number;
  targetCustomers: number;
  projectedSavings: number;
}

export interface QAAgentArtifacts {
  constraints: string[];
  validationsPassed: number;
  validationsFailed: number;
  warnings?: string[];
  pass: boolean;
}

export type AgentArtifacts =
  | DataAgentArtifacts
  | MLAgentArtifacts
  | StrategyAgentArtifacts
  | QAAgentArtifacts;

export interface AgentStep {
  agent: AgentName;
  tookMs: number;
  artifacts: AgentArtifacts;
  status: 'running' | 'complete' | 'error';
}

export interface AgentRunOutput {
  roi: number;
  annualSavings: number;
  paybackMonths?: number;
  netBenefit?: number;
}

export interface AgentRun {
  runId: string;
  scenarioType: 'budget' | 'contract' | 'onboarding';
  startedAt: number;
  completedAt?: number;
  steps: AgentStep[];
  output?: AgentRunOutput;
  status: 'running' | 'complete' | 'error';
}
