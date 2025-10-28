import React from 'react';

interface ChartContainerProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function ChartContainer({
  title,
  isLoading = false,
  children,
  className = '',
}: ChartContainerProps) {
  return (
    <div className={`chart-container ${className}`}>
      <h3 className="text-xl font-semibold text-text-primary mb-4">{title}</h3>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
