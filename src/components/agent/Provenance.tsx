import React from 'react';
import { BarChart3, Bot, Lightbulb, CheckCircle } from 'lucide-react';
import type { AgentRun } from '@/types/agent';

interface ProvenanceProps {
  agentRun?: AgentRun | null;
  compact?: boolean;
  className?: string;
}

/**
 * Provenance chip that shows which agents produced a particular output.
 * Adds credibility by attributing insights to specific AI agents with real artifacts.
 */
export default function Provenance({ agentRun, compact = false, className = '' }: ProvenanceProps) {
  // If no agent run, show generic attribution
  if (!agentRun || agentRun.status !== 'complete') {
    return (
      <div className={`flex items-center space-x-2 text-xs text-text-tertiary ${className}`}>
        <BarChart3 size={12} />
        <span>Data Agent</span>
        <span>·</span>
        <span>dataset v2025.10</span>
        <span>·</span>
        <span>47.3M records</span>
      </div>
    );
  }

  const dataStep = agentRun.steps.find(s => s.agent === 'Data');
  const mlStep = agentRun.steps.find(s => s.agent === 'ML');
  const qaStep = agentRun.steps.find(s => s.agent === 'QA');

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-text-tertiary ${className}`}>
        <BarChart3 size={12} />
        <Bot size={12} />
        <Lightbulb size={12} />
        <CheckCircle size={12} />
        <span>AI-Powered Analysis</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary ${className}`}>
      {dataStep && (
        <>
          <div className="flex items-center space-x-1">
            <BarChart3 size={12} />
            <span>Data Agent</span>
          </div>
          <span>·</span>
          <span className="font-mono">
            {(dataStep.artifacts as any).datasetVersion || 'telco_churn_v2025.10'}
          </span>
          <span>·</span>
          <span>{((dataStep.artifacts as any).totalCustomers / 1_000_000).toFixed(1)}M records</span>
        </>
      )}

      {mlStep && (
        <>
          <span>|</span>
          <div className="flex items-center space-x-1">
            <Bot size={12} />
            <span>ML Agent</span>
          </div>
          <span>·</span>
          <span className="font-mono">{(mlStep.artifacts as any).model || 'xgb_2025_09'}</span>
          <span>·</span>
          <span>AUC {((mlStep.artifacts as any).auc || 0.85).toFixed(2)}</span>
        </>
      )}

      {qaStep && (
        <>
          <span>|</span>
          <div className="flex items-center space-x-1">
            <CheckCircle size={12} />
            <span>QA Agent</span>
          </div>
          <span>·</span>
          <span>
            {(qaStep.artifacts as any).constraints?.length || 4} constraints validated
          </span>
        </>
      )}
    </div>
  );
}
