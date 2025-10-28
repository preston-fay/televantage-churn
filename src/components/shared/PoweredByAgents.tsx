import React from 'react';

interface PoweredByAgentsProps {
  compact?: boolean;
}

export default function PoweredByAgents({ compact = false }: PoweredByAgentsProps) {
  return (
    <div className={`text-gray-400 ${compact ? "text-xs" : "text-sm"} flex items-center justify-center gap-1`}>
      <span>Powered by&nbsp;<strong>Multi-Agent AI</strong></span>
      {!compact && <span className="text-gray-500">| Data | ML | Strategy | QA</span>}
    </div>
  );
}
