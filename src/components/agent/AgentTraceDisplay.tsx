import React, { useState } from 'react';
import { BarChart3, Bot, Lightbulb, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { AgentRun, AgentName, DataAgentArtifacts, MLAgentArtifacts, StrategyAgentArtifacts, QAAgentArtifacts } from '@/types/agent';
import { formatCurrency, formatLargeNumber } from '@/utils/formatters';

interface AgentTraceDisplayProps {
  agentRun: AgentRun | null;
  compact?: boolean;
}

const AGENT_ICONS: Record<AgentName, React.ElementType> = {
  Data: BarChart3,
  ML: Bot,
  Strategy: Lightbulb,
  QA: CheckCircle,
};

export default function AgentTraceDisplay({ agentRun, compact = false }: AgentTraceDisplayProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  if (!agentRun) return null;

  const allSteps = ['Data', 'ML', 'Strategy', 'QA'] as AgentName[];
  const completedSteps = agentRun.steps.filter(s => s.status === 'complete');

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-4 p-4 rounded border" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-accent-primary)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-text-primary text-sm font-semibold flex items-center">
            {agentRun.status === 'running' && <Loader2 size={16} className="mr-2 animate-spin" />}
            {agentRun.status === 'complete' && '✓ '}
            Agent Pipeline {agentRun.status === 'running' ? 'Processing' : 'Complete'}
          </div>
          <div className="text-text-tertiary text-xs">
            {completedSteps.length} / {allSteps.length} steps
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center space-x-2 mb-3">
          {allSteps.map((agentName, index) => {
            const step = agentRun.steps.find(s => s.agent === agentName);
            const isComplete = step && step.status === 'complete';
            const isRunning = step && step.status === 'running';
            const Icon = AGENT_ICONS[agentName];

            return (
              <React.Fragment key={agentName}>
                <div
                  className="flex-1 flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isComplete
                      ? 'var(--color-accent-primary)'
                      : isRunning
                      ? 'var(--color-bg-secondary)'
                      : 'var(--color-bg-primary)',
                    opacity: isComplete ? 1 : isRunning ? 0.8 : 0.4,
                  }}
                  onClick={() => isComplete && setExpandedStep(expandedStep === index ? null : index)}
                >
                  <Icon size={16} className={isComplete ? 'text-white' : 'text-text-tertiary'} />
                  <div className={`text-xs font-medium ${isComplete ? 'text-white' : 'text-text-tertiary'}`}>
                    {agentName}
                  </div>
                  {isRunning && <Loader2 size={12} className="text-text-primary animate-spin ml-auto" />}
                  {isComplete && !compact && expandedStep !== index && (
                    <ChevronDown size={12} className="text-white ml-auto" />
                  )}
                  {isComplete && !compact && expandedStep === index && (
                    <ChevronUp size={12} className="text-white ml-auto" />
                  )}
                </div>
                {index < allSteps.length - 1 && (
                  <div
                    className="w-4 h-0.5"
                    style={{
                      backgroundColor: completedSteps.length > index + 1
                        ? 'var(--color-accent-primary)'
                        : 'var(--color-border-primary)',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Expanded Step Details */}
        {!compact && expandedStep !== null && agentRun.steps[expandedStep] && (
          <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="text-text-primary text-sm font-semibold mb-3">
              {agentRun.steps[expandedStep].agent} Agent Artifacts
            </div>
            <ArtifactDisplay artifacts={agentRun.steps[expandedStep].artifacts} />
            <div className="mt-3 text-text-tertiary text-xs">
              Execution time: {agentRun.steps[expandedStep].tookMs}ms
            </div>
          </div>
        )}

        {/* Output Summary */}
        {agentRun.status === 'complete' && agentRun.output && !compact && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-text-tertiary text-xs mb-1">Annual Savings</div>
                <div className="text-text-primary text-lg font-bold">
                  {formatCurrency(agentRun.output.annualSavings, 0)}
                </div>
              </div>
              <div>
                <div className="text-text-tertiary text-xs mb-1">ROI</div>
                <div className="text-text-primary text-lg font-bold">
                  {agentRun.output.roi > 0 ? '+' : ''}{(agentRun.output.roi * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArtifactDisplay({ artifacts }: { artifacts: any }) {
  // Type guard functions
  const isDataArtifacts = (a: any): a is DataAgentArtifacts => 'datasetVersion' in a;
  const isMLArtifacts = (a: any): a is MLAgentArtifacts => 'model' in a && 'auc' in a;
  const isStrategyArtifacts = (a: any): a is StrategyAgentArtifacts => 'scenarioType' in a;
  const isQAArtifacts = (a: any): a is QAAgentArtifacts => 'constraints' in a;

  if (isDataArtifacts(artifacts)) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Dataset:</span>
          <span className="text-text-primary font-mono text-xs">{artifacts.datasetVersion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Total Customers:</span>
          <span className="text-text-primary">{formatLargeNumber(artifacts.totalCustomers)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Segments Analyzed:</span>
          <span className="text-text-primary">{artifacts.segmentsAnalyzed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Cohort:</span>
          <span className="text-text-primary text-xs">{artifacts.cohort}</span>
        </div>
        <div className="mt-2">
          <div className="text-text-tertiary text-xs mb-1">Filters Applied:</div>
          <div className="space-y-1">
            {artifacts.filters.map((filter, i) => (
              <div key={i} className="text-text-secondary text-xs font-mono bg-bg-primary px-2 py-1 rounded">
                {filter}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isMLArtifacts(artifacts)) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Model:</span>
          <span className="text-text-primary font-mono text-xs">{artifacts.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">AUC Score:</span>
          <span className="text-text-primary font-bold">{artifacts.auc.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Predictions Generated:</span>
          <span className="text-text-primary">{formatLargeNumber(artifacts.predictionsGenerated)}</span>
        </div>
        {artifacts.upliftPct !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-tertiary">Predicted Uplift:</span>
            <span className="text-text-primary">+{artifacts.upliftPct.toFixed(1)}%</span>
          </div>
        )}
        {artifacts.targetRate !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-tertiary">Target Rate:</span>
            <span className="text-text-primary">{artifacts.targetRate.toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  }

  if (isStrategyArtifacts(artifacts)) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Scenario:</span>
          <span className="text-text-primary capitalize">{artifacts.scenarioType}</span>
        </div>
        {artifacts.budget !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-tertiary">Budget Allocated:</span>
            <span className="text-text-primary">{formatCurrency(artifacts.budget, 0)}</span>
          </div>
        )}
        {artifacts.conversionRate !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-tertiary">Conversion Rate:</span>
            <span className="text-text-primary">{(artifacts.conversionRate * 100).toFixed(0)}%</span>
          </div>
        )}
        {artifacts.churnReduction !== undefined && (
          <div className="flex justify-between">
            <span className="text-text-tertiary">Churn Reduction:</span>
            <span className="text-text-primary">{(artifacts.churnReduction * 100).toFixed(0)}%</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-text-tertiary">Target Customers:</span>
          <span className="text-text-primary">{formatLargeNumber(artifacts.targetCustomers)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Projected Savings:</span>
          <span className="text-text-primary font-bold">{formatCurrency(artifacts.projectedSavings, 0)}</span>
        </div>
      </div>
    );
  }

  if (isQAArtifacts(artifacts)) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Validation Status:</span>
          <span className={artifacts.pass ? 'text-text-primary' : 'text-red-500'}>
            {artifacts.pass ? '✓ All checks passed' : '✗ Validation failed'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Checks Run:</span>
          <span className="text-text-primary">
            {artifacts.validationsPassed + artifacts.validationsFailed}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-text-tertiary text-xs mb-1">Constraints Validated:</div>
          <div className="space-y-1">
            {artifacts.constraints.map((constraint, i) => (
              <div key={i} className="text-text-secondary text-xs flex items-center">
                <span className="text-text-primary mr-2">✓</span>
                {constraint}
              </div>
            ))}
          </div>
        </div>
        {artifacts.warnings && artifacts.warnings.length > 0 && (
          <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            <div className="text-text-tertiary text-xs mb-1">⚠ Warnings:</div>
            {artifacts.warnings.map((warning, i) => (
              <div key={i} className="text-text-secondary text-xs">{warning}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="text-text-tertiary text-sm">No artifacts available</div>;
}
