import React from 'react';

interface InsightCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function InsightCard({ children, className = '' }: InsightCardProps) {
  return (
    <div
      className={`w-full p-8 rounded-lg mb-8 ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        borderLeft: '4px solid var(--color-accent-primary)',
      }}
    >
      {children}
    </div>
  );
}
