/**
 * Finance Tooltip Component
 *
 * Provides hover tooltips with definitions for financial terms
 */

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export const FINANCIAL_GLOSSARY: Record<string, string> = {
  ARPU: 'Average Revenue Per User: Monthly revenue divided by active subscribers. Key indicator of pricing power and customer value.',
  IRR: 'Internal Rate of Return: Annualized effective return from strategy cash flows. Accounts for time value of money.',
  CLTV: 'Customer Lifetime Value: Net present value of gross margin per customer over their expected lifetime.',
  LTV: 'Lifetime Value: See CLTV. Total value a customer brings to the business over their relationship.',
  EBITDA: 'Earnings Before Interest, Taxes, Depreciation & Amortization: Core operating profitability measure.',
  SAC: 'Subscriber Acquisition Cost: Total cost to acquire a new customer, including marketing, sales, and onboarding.',
  MRR: 'Monthly Recurring Revenue: Predictable revenue stream from active subscriptions.',
  NPS: 'Net Promoter Score: Customer loyalty metric ranging from -100 to +100. Measures likelihood to recommend.',
  ROI: 'Return on Investment: Total return as a percentage of investment. (Return - Investment) / Investment × 100%.',
  'Churn Rate': 'Percentage of customers who cancel service in a given period. Key retention metric.',
  'Gross Margin': 'Revenue minus cost of goods sold, expressed as percentage. Measures profitability before overhead.',
  'Retention Rate': 'Percentage of customers who remain active. Inverse of churn rate.',
};

interface FinanceTooltipProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

export default function FinanceTooltip({ term, children, className = '' }: FinanceTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const definition = FINANCIAL_GLOSSARY[term] || FINANCIAL_GLOSSARY[term.toUpperCase()];

  if (!definition) {
    // If no definition found, just render children without tooltip
    return <>{children || term}</>;
  }

  return (
    <span
      className={`relative inline-flex items-center gap-1 ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || term}
      <HelpCircle size={14} className="text-text-tertiary cursor-help" />

      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-50"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="bg-bg-secondary border rounded-lg p-3 shadow-lg"
            style={{ borderColor: 'var(--color-border-primary)' }}
          >
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-accent-primary)' }}>
              {term}
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              {definition}
            </div>
            {/* Arrow */}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid var(--color-border-primary)',
              }}
            />
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * Inline Finance Term with Tooltip
 */
export function FinanceTerm({ term, value, className = '' }: { term: string; value?: string | number; className?: string }) {
  return (
    <FinanceTooltip term={term} className={className}>
      <span className="font-semibold">
        {term}
        {value !== undefined && `: ${value}`}
      </span>
    </FinanceTooltip>
  );
}

/**
 * KPI Card with Tooltip
 */
interface KpiCardProps {
  title: string;
  value: string | number;
  tooltip?: boolean;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function KpiCard({ title, value, tooltip = true, subtitle, trend, className = '' }: KpiCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-text-tertiary'
  };

  const trendSymbols = {
    up: '↑',
    down: '↓',
    neutral: '→'
  };

  const content = (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-primary)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        {tooltip ? (
          <FinanceTooltip term={title}>
            <span className="text-sm text-text-tertiary">{title}</span>
          </FinanceTooltip>
        ) : (
          <span className="text-sm text-text-tertiary">{title}</span>
        )}
        {trend && (
          <span className={`text-lg font-bold ${trendColors[trend]}`}>
            {trendSymbols[trend]}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-text-tertiary mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );

  return content;
}
