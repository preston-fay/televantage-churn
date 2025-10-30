import React from 'react';

interface PoweredByAgentsProps {
  compact?: boolean;
}

export default function PoweredByAgents({ compact = false }: PoweredByAgentsProps) {
  return (
    <div className={`text-gray-400 ${compact ? "text-xs" : "text-sm"} flex items-center justify-center gap-1`}>
      <span>Powered by&nbsp;<strong>ChatGPT-4</strong></span>
    </div>
  );
}
