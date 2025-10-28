import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import KPICard from '@/components/shared/KPICard';
import ChartContainer from '@/components/shared/ChartContainer';
import DonutChart from '@/components/charts/DonutChart';
import WaterfallChart from '@/components/charts/WaterfallChart';
import { formatCompactCurrency, formatLargeNumber, formatPercent } from '@/utils/formatters';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { getFinancialMetrics, formatFinancial } from '@/services/financialData';
import { riskColorMap } from '@/utils/colors';
import PoweredByAgents from '@/components/shared/PoweredByAgents';
import numeral from 'numeral';

export default function ExecutiveDashboard() {
  const { data, isLoading, error, assumptions } = useAppContext();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Get financial metrics
  const financialMetrics = useMemo(() => {
    return getFinancialMetrics(data, assumptions);
  }, [data, assumptions]);

  // Prepare donut chart data
  const riskData = useMemo(() => {
    if (!data?.risk_distribution) return [];

    return data.risk_distribution.risk_levels.map((level) => ({
      level: level.level,
      customers: level.customers,
      percentage: level.percentage,
      color: riskColorMap[level.level] || riskColorMap['Low'],
    }));
  }, [data]);

  // Prepare waterfall chart data
  const waterfallData = useMemo(() => {
    if (!data?.metrics) return [];

    const { annual_churn_cost, ai_opportunity } = data.metrics.overview;
    const residual = annual_churn_cost - ai_opportunity;

    return [
      {
        label: 'Current Annual Turnover',
        value: annual_churn_cost,
        type: 'loss' as const,
      },
      {
        label: 'Retention Opportunity',
        value: -ai_opportunity,
        type: 'gain' as const,
      },
      {
        label: 'Optimized Turnover',
        value: residual,
        type: 'total' as const,
      },
    ];
  }, [data]);

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div style={{ color: 'var(--color-chart-7)' }}>Error loading data: {error}</div>
      </div>
    );
  }

  const { metrics } = data;

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-text-primary mb-2">Executive Dashboard</h2>
      <p className="text-text-secondary text-lg mb-8">
        Customer churn is a natural part of telecom business operations. Our analysis identifies patterns in preventable turnover and quantifies strategic retention opportunities.
      </p>

      {/* Industry Context Banner */}
      <div className="card mb-8 p-6" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderLeft: '4px solid var(--color-accent-primary)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-text-tertiary text-sm font-medium mb-1">Your Churn Rate</div>
            <div className="text-text-primary text-3xl font-bold">16.5%</div>
            <div className="text-text-secondary text-sm mt-1">7.8M annual customer turnover</div>
          </div>
          <div>
            <div className="text-text-tertiary text-sm font-medium mb-1">Industry Benchmark</div>
            <div className="text-text-primary text-3xl font-bold">22-28%</div>
            <div className="text-text-secondary text-sm mt-1">Top quartile: 15-18%</div>
          </div>
          <div>
            <div className="text-text-tertiary text-sm font-medium mb-1">Performance</div>
            <div className="text-3xl font-bold text-text-primary">Top Quartile</div>
            <div className="text-text-secondary text-sm mt-1">Still $2.2B optimization opportunity</div>
          </div>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <KPICard
          label="Total Customers"
          value={metrics.overview.total_customers}
          formatter={(v) => formatLargeNumber(v)}
        />
        <div className="card">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-text-tertiary text-sm font-medium">Average Revenue Per User (ARPU)</div>
            <div className="group relative">
              <Info size={16} className="text-text-tertiary cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-bg-primary border border-border-primary rounded shadow-lg text-text-secondary text-xs w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                ARPU = Total Service Revenue ÷ Active Subscribers. Key indicator of pricing power and customer value.
              </div>
            </div>
          </div>
          <div className="text-text-primary text-3xl font-bold mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ${numeral(financialMetrics.arpu).format('0,0.00')}
          </div>
          <div className="text-text-secondary text-sm">Per month</div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-text-tertiary text-sm font-medium">EBITDA Impact</div>
            <div className="group relative">
              <Info size={16} className="text-text-tertiary cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-bg-primary border border-border-primary rounded shadow-lg text-text-secondary text-xs w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Earnings before interest, taxes, depreciation & amortization. Core operating profitability measure from retention strategies.
              </div>
            </div>
          </div>
          <div className="text-text-primary text-3xl font-bold mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {numeral(financialMetrics.ebitdaImpact).format('$0.0a').toUpperCase()}
          </div>
          <div className="text-text-secondary text-sm">Annual opportunity</div>
        </div>
        <KPICard
          label="Addressable Retention Opportunity"
          value={metrics.overview.ai_opportunity}
          formatter={(v) => formatCompactCurrency(v)}
        />
        <div className="card">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-text-tertiary text-sm font-medium">Prediction Accuracy (AUC)</div>
            <div className="group relative">
              <Info size={16} className="text-text-tertiary cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-bg-primary border border-border-primary rounded shadow-lg text-text-secondary text-xs w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Our model correctly identifies 85% of at-risk customers while maintaining false positive rates below 15%, enabling precise resource allocation
              </div>
            </div>
          </div>
          <div className="text-text-primary text-3xl font-bold mb-2">{formatPercent(metrics.overview.model_auc, 1)}</div>
          <div className="text-text-secondary text-sm">Industry-leading precision</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartContainer title="Customer Risk Distribution">
          <div className="flex justify-center">
            <DonutChart
              data={riskData}
              width={650}
              height={650}
              centerLabel="Total Customers"
              centerValue="47.3M"
            />
          </div>
          <p className="text-text-secondary text-sm text-center mt-4">
            38% of customers (18M) are in high or very high risk categories—our primary intervention targets
          </p>
        </ChartContainer>

        <ChartContainer title="Retention Economics Opportunity">
          <WaterfallChart data={waterfallData} width={650} height={500} />
          <p className="text-text-secondary text-sm text-center mt-4">
            Targeted interventions can reduce annual turnover impact by $2.2B through strategic retention programs
          </p>
        </ChartContainer>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h3 className="text-2xl font-semibold text-text-primary mb-2">Strategic Retention Roadmap</h3>
        <p className="text-text-secondary mb-6">
          Three high-impact initiatives to optimize customer retention and reduce preventable churn
        </p>
        <div className="space-y-4">
          {/* Recommendation 1: Budget Optimization (reordered to Priority 1) */}
          <div className="p-6 bg-bg-tertiary rounded-lg border-l-4 cursor-pointer hover:bg-opacity-80 transition-colors"
               style={{ borderLeftColor: 'var(--color-accent-primary)' }}
               onClick={() => setExpandedCard(expandedCard === 1 ? null : 1)}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3 flex-1">
                <h4 className="font-semibold text-text-primary text-lg">Priority 1: Precision Retention Targeting</h4>
                {expandedCard === 1 ? <ChevronUp size={20} className="text-text-tertiary" /> : <ChevronDown size={20} className="text-text-tertiary" />}
              </div>
              <span className="px-3 py-1 rounded text-sm font-medium text-white ml-4" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                Quick Win
              </span>
            </div>
            <p className="text-text-secondary mb-4">
              Deploy AI-driven customer scoring to allocate retention budget with surgical precision, focusing resources on high-value at-risk customers with the highest save probability.
            </p>

            {expandedCard === 1 && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
                <h5 className="text-text-primary font-semibold mb-3">The Challenge</h5>
                <p className="text-text-secondary mb-4">
                  Current retention spending often lacks precision—resources are allocated broadly without accounting for churn probability or customer value. This approach wastes budget on low-risk customers while missing high-value opportunities.
                </p>

                <h5 className="text-text-primary font-semibold mb-3">Our Approach</h5>
                <p className="text-text-secondary mb-4">
                  By investing <strong className="text-text-primary">$220M annually</strong> in <strong className="text-text-primary">AI-targeted interventions</strong> ($50/customer average), we focus exclusively on the 4.4M customers where:
                </p>
                <ul className="list-disc list-inside text-text-secondary mb-4 ml-4 space-y-1">
                  <li>Churn probability exceeds 30% (model-scored)</li>
                  <li>Customer lifetime value justifies intervention cost</li>
                  <li>Historical save rate data suggests receptiveness to offers</li>
                </ul>

                <h5 className="text-text-primary font-semibold mb-3">Expected Outcomes</h5>
                <p className="text-text-secondary mb-4">
                  With a conservative <strong className="text-text-primary">30% save rate</strong>, we retain <strong className="text-text-primary">1.32M customers</strong>, generating <strong className="text-text-primary">$571M in annual retention value</strong> against $220M investment—a <strong className="text-text-primary">160% ROI</strong>.
                </p>

                <h5 className="text-text-primary font-semibold mb-3 mt-6">Implementation Roadmap</h5>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">1.</span>
                    <span><strong className="text-text-primary">Real-time scoring:</strong> Deploy daily churn probability updates across all 47.3M customers using production ML infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">2.</span>
                    <span><strong className="text-text-primary">Tiered interventions:</strong> High-risk (70%+ churn probability): $75 retention offer | Medium-risk (40-70%): $50 offer | Low-risk: nurture campaigns only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">3.</span>
                    <span><strong className="text-text-primary">Continuous optimization:</strong> Monthly A/B testing of offer amounts, channels, and messaging with budget reallocation toward highest-performing segments</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm mt-4">
              <div>
                <div className="text-text-tertiary">Retention Value</div>
                <div className="text-text-primary font-semibold">$571M</div>
              </div>
              <div>
                <div className="text-text-tertiary">Implementation Effort</div>
                <div className="text-text-primary font-semibold">Low</div>
              </div>
              <div>
                <div className="text-text-tertiary">Time to Value</div>
                <div className="text-text-primary font-semibold">3 months</div>
              </div>
            </div>
          </div>

          {/* Recommendation 2: Contract Conversion */}
          <div className="p-6 bg-bg-tertiary rounded-lg border-l-4 cursor-pointer hover:bg-opacity-80 transition-colors"
               style={{ borderLeftColor: 'var(--color-accent-primary)' }}
               onClick={() => setExpandedCard(expandedCard === 2 ? null : 2)}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3 flex-1">
                <h4 className="font-semibold text-text-primary text-lg">Priority 2: Contract Commitment Strategy</h4>
                {expandedCard === 2 ? <ChevronUp size={20} className="text-text-tertiary" /> : <ChevronDown size={20} className="text-text-tertiary" />}
              </div>
              <span className="px-3 py-1 rounded text-sm font-medium text-white ml-4" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                High Impact
              </span>
            </div>
            <p className="text-text-secondary mb-4">
              Convert month-to-month customers to annual contracts through targeted incentive programs, reducing voluntary churn while improving customer economics.
            </p>

            {expandedCard === 2 && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
                <h5 className="text-text-primary font-semibold mb-3">The Opportunity</h5>
                <p className="text-text-secondary mb-4">
                  Analysis reveals <strong className="text-text-primary">19.9M customers (42%)</strong> operate on month-to-month contracts with <strong className="text-text-primary">25% annual churn rate</strong>—5x higher than annual contract holders. These customers lack commitment mechanisms, making them vulnerable to competitive offers and switching convenience.
                </p>

                <h5 className="text-text-primary font-semibold mb-3">Strategic Approach</h5>
                <p className="text-text-secondary mb-4">
                  Target month-to-month customers with 15-40% churn probability (those teetering between staying and leaving). By offering a <strong className="text-text-primary">$50 incentive</strong> (bill credit or premium features) for 12-month commitment, we create mutual value: customers receive tangible benefit while we secure retention.
                </p>

                <h5 className="text-text-primary font-semibold mb-3">Financial Impact</h5>
                <p className="text-text-secondary mb-4">
                  Converting <strong className="text-text-primary">20% of targeted month-to-month customers</strong> (3.97M) reduces portfolio churn from 16.5% to 14.3%, retaining <strong className="text-text-primary">516K customers</strong> who would have otherwise churned. Net retention value: <strong className="text-text-primary">$223M annually</strong> after incentive costs.
                </p>

                <h5 className="text-text-primary font-semibold mb-3 mt-6">Implementation Roadmap</h5>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">1.</span>
                    <span><strong className="text-text-primary">Intelligent targeting:</strong> Use AI to identify month-to-month customers with high lifetime value and moderate churn risk (15-40% probability) for optimal conversion likelihood</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">2.</span>
                    <span><strong className="text-text-primary">Compelling offer design:</strong> Test $50 bill credit vs. free premium service additions (e.g., HD streaming, hotspot data) to determine highest-converting value proposition</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">3.</span>
                    <span><strong className="text-text-primary">Phased rollout:</strong> Pilot with 100K customers in Q1 to validate conversion rates and economics, then scale nationally across Q2-Q3 with learnings applied</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm mt-4">
              <div>
                <div className="text-text-tertiary">Retention Value</div>
                <div className="text-text-primary font-semibold">$223M</div>
              </div>
              <div>
                <div className="text-text-tertiary">Implementation Effort</div>
                <div className="text-text-primary font-semibold">Medium</div>
              </div>
              <div>
                <div className="text-text-tertiary">Time to Value</div>
                <div className="text-text-primary font-semibold">6 months</div>
              </div>
            </div>
          </div>

          {/* Recommendation 3: Onboarding Excellence */}
          <div className="p-6 bg-bg-tertiary rounded-lg border-l-4 cursor-pointer hover:bg-opacity-80 transition-colors"
               style={{ borderLeftColor: 'var(--color-accent-primary)' }}
               onClick={() => setExpandedCard(expandedCard === 3 ? null : 3)}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3 flex-1">
                <h4 className="font-semibold text-text-primary text-lg">Priority 3: First Impression Excellence</h4>
                {expandedCard === 3 ? <ChevronUp size={20} className="text-text-tertiary" /> : <ChevronDown size={20} className="text-text-tertiary" />}
              </div>
              <span className="px-3 py-1 rounded text-sm font-medium text-white ml-4" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                Foundation Builder
              </span>
            </div>
            <p className="text-text-secondary mb-4">
              Redesign the first 90 days of customer experience through proactive engagement, personalized support, and value demonstration to reduce early-stage churn.
            </p>

            {expandedCard === 3 && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
                <h5 className="text-text-primary font-semibold mb-3">The Critical Window</h5>
                <p className="text-text-secondary mb-4">
                  Early-tenure customers (0-3 months) represent <strong className="text-text-primary">11.8M subscribers (25%)</strong> but experience <strong className="text-text-primary">40% annual churn rate</strong>—the highest-risk cohort in our customer base. These new customers are still evaluating whether our service justifies continued payment, making early experience decisive.
                </p>

                <h5 className="text-text-primary font-semibold mb-3">Root Cause Analysis</h5>
                <p className="text-text-secondary mb-4">
                  New customers churn primarily due to:
                </p>
                <ul className="list-disc list-inside text-text-secondary mb-4 ml-4 space-y-1">
                  <li><strong className="text-text-primary">Setup friction:</strong> Complex activation and device configuration create negative first impressions</li>
                  <li><strong className="text-text-primary">Value uncertainty:</strong> Customers don't yet understand features they're paying for</li>
                  <li><strong className="text-text-primary">Unresolved issues:</strong> Early technical problems without quick resolution erode trust</li>
                </ul>

                <h5 className="text-text-primary font-semibold mb-3">Enhanced Onboarding Program</h5>
                <p className="text-text-secondary mb-4">
                  Reducing early churn by <strong className="text-text-primary">30%</strong> through enhanced onboarding retains <strong className="text-text-primary">227K customers annually</strong>, generating <strong className="text-text-primary">$98M retention value</strong>. Program investment of $50M yields <strong className="text-text-primary">3-year NPV of $194M</strong>.
                </p>

                <h5 className="text-text-primary font-semibold mb-3 mt-6">Implementation Roadmap</h5>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">1.</span>
                    <span><strong className="text-text-primary">Frictionless activation:</strong> Deliver personalized setup guide within 24 hours with video tutorials, live chat support, and one-click device configuration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">2.</span>
                    <span><strong className="text-text-primary">Proactive engagement:</strong> AI-triggered check-ins at Days 7, 30, and 60 for customers showing low engagement, service issues, or usage below expected patterns</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-text-primary">3.</span>
                    <span><strong className="text-text-primary">Value reinforcement:</strong> Monthly usage reports highlighting features, savings vs. competitors, and personalized recommendations to maximize service value</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm mt-4">
              <div>
                <div className="text-text-tertiary">Retention Value</div>
                <div className="text-text-primary font-semibold">$98M</div>
              </div>
              <div>
                <div className="text-text-tertiary">Implementation Effort</div>
                <div className="text-text-primary font-semibold">High</div>
              </div>
              <div>
                <div className="text-text-tertiary">Time to Value</div>
                <div className="text-text-primary font-semibold">12 months</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 mb-4">
        <PoweredByAgents />
      </footer>
    </div>
  );
}
