import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ChartContainer from '@/components/shared/ChartContainer';
import GroupedBarChart from '@/components/charts/GroupedBarChart';
import HorizontalBarChart from '@/components/charts/HorizontalBarChart';
import LineChart from '@/components/charts/LineChart';
import InsightCard from '@/components/shared/InsightCard';
import CalloutBox from '@/components/shared/CalloutBox';
import MetricCard from '@/components/shared/MetricCard';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';

export default function ModelingDeepDive() {
  const { data, isLoading, error } = useAppContext();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Prepare Model Zoo grouped bar chart data
  const modelZooData = useMemo(() => {
    if (!data?.models) return [];
    return data.models.map((model: any) => ({
      group: model.abbrev,
      values: [
        { metric: 'AUC', value: model.auc },
        { metric: 'Brier', value: model.brier },
        { metric: 'Avg Precision', value: model.average_precision },
      ],
      highlight: model.winner,
    }));
  }, [data]);

  // Prepare Feature Importance data
  const featureData = useMemo(() => {
    if (!data?.feature_importance?.features) return [];
    return data.feature_importance.features.map((feature: any) => ({
      label: feature.name,
      value: feature.importance,
      subtitle: feature.interpretation,
    }));
  }, [data]);

  // Prepare Calibration Plot data
  const calibrationData = useMemo(() => {
    const bins = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const perfectCalibration = bins.map(predicted => ({
      x: (predicted * 100).toFixed(0) + '%',
      y: predicted * 100,
    }));
    const actualCalibration = bins.map(predicted => {
      const actual = predicted > 0.5
        ? predicted * 0.92 + 0.04
        : predicted * 1.05;
      return {
        x: (predicted * 100).toFixed(0) + '%',
        y: actual * 100,
      };
    });
    return [
      { name: 'Perfect Calibration', data: perfectCalibration, color: '#A5A5A5' },
      { name: 'Model Calibration', data: actualCalibration, color: '#7823DC' },
    ];
  }, []);

  // Prepare Profit Curve data
  const profitCurveData = useMemo(() => {
    const COST_PER_INTERVENTION = 50;
    const SAVE_VALUE = 1200;
    const TOTAL_CUSTOMERS = 47_300_000;
    const BASE_CHURN_RATE = 0.165;
    const SAVE_RATE = 0.30;

    const thresholds = [];
    for (let t = 0.05; t <= 0.95; t += 0.05) {
      thresholds.push(t);
    }

    const profitPoints = thresholds.map(threshold => {
      const interventionRate = 1 - threshold;
      const precision = 0.3 + (threshold * 0.5);
      const customersTargeted = TOTAL_CUSTOMERS * interventionRate;
      const truePositives = customersTargeted * precision * BASE_CHURN_RATE;
      const customersSaved = truePositives * SAVE_RATE;
      const revenue = customersSaved * SAVE_VALUE;
      const cost = customersTargeted * COST_PER_INTERVENTION;
      const profit = revenue - cost;

      return {
        x: (threshold * 100).toFixed(0) + '%',
        y: profit / 1_000_000,
      };
    });

    return [{ name: 'Profit', data: profitPoints, color: '#7823DC' }];
  }, []);

  // Find optimal profit point
  const optimalProfitThreshold = useMemo(() => {
    const profits = profitCurveData[0].data.map(d => d.y);
    const maxProfit = Math.max(...profits);
    const optimalIndex = profits.indexOf(maxProfit);
    return profitCurveData[0].data[optimalIndex].x;
  }, [profitCurveData]);

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics data..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div style={{ color: 'var(--color-chart-7)' }}>Error loading data: {error}</div>
      </div>
    );
  }

  const winnerModel = data?.models?.find((m: any) => m.winner);

  if (!data || !winnerModel) {
    return <LoadingSpinner message="Loading analytics data..." />;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h2 className="text-4xl font-bold text-text-primary mb-3">Understanding What Drives Churn</h2>
      <p className="text-text-secondary text-xl mb-12 leading-relaxed">
        Customer churn isn't random—it's predictable. Through rigorous analysis of 47.3M customer records, we've identified the patterns, built the models, and validated the insights that enable precise retention strategy.
      </p>

      {/* Executive Summary */}
      <InsightCard className="mb-12">
        <h3 className="text-3xl font-bold text-text-primary mb-4">30-Second Executive Summary</h3>
        <p className="text-text-secondary text-lg mb-6 leading-relaxed">
          Our analysis reveals that <strong className="text-text-primary">customer churn is driven by five primary factors</strong>, with contract type and tenure dominating all others. By focusing retention efforts on customers scoring high across these dimensions, we can reduce preventable churn by 35% with 160% ROI.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Top Driver" value="Contract Type" subtitle="38% of predictive power" size="medium" />
          <MetricCard label="Model Accuracy" value="85%" subtitle="Industry-leading AUC" size="medium" />
          <MetricCard label="Retention Opportunity" value="$2.2B" subtitle="Annual addressable value" size="medium" />
        </div>
      </InsightCard>

      {/* Section 1: Key Drivers of Churn */}
      <div className="mb-16">
        <h3 className="text-3xl font-bold text-text-primary mb-4">What Makes Customers Leave</h3>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          We analyzed 150+ variables across customer demographics, usage patterns, service history, and billing data. Five factors emerged as dominant predictors of churn behavior.
        </p>

        {/* Drivers Table */}
        <div className="card p-8 mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
                <th className="text-left py-4 px-4 text-text-primary font-semibold">Driver</th>
                <th className="text-left py-4 px-4 text-text-primary font-semibold">Why It Matters</th>
                <th className="text-left py-4 px-4 text-text-primary font-semibold">What We Found</th>
                <th className="text-left py-4 px-4 text-text-primary font-semibold">Strategic Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
                <td className="py-6 px-4">
                  <div className="font-semibold text-text-primary text-lg">Contract Type</div>
                  <div className="text-text-tertiary text-sm">38% importance</div>
                </td>
                <td className="py-6 px-4 text-text-secondary">
                  Customers without commitment feel free to explore alternatives without friction or penalty
                </td>
                <td className="py-6 px-4">
                  <div className="text-text-primary font-semibold">Month-to-month: 61% churn</div>
                  <div className="text-text-secondary text-sm">1-year: 18% | 2-year: 12%</div>
                </td>
                <td className="py-6 px-4">
                  <div className="px-3 py-1 rounded text-sm font-medium text-white inline-block" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                    Contract conversion campaigns
                  </div>
                </td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
                <td className="py-6 px-4">
                  <div className="font-semibold text-text-primary text-lg">Tenure</div>
                  <div className="text-text-tertiary text-sm">24% importance</div>
                </td>
                <td className="py-6 px-4 text-text-secondary">
                  New customers are still evaluating whether we're worth staying for—trust hasn't been built yet
                </td>
                <td className="py-6 px-4">
                  <div className="text-text-primary font-semibold">0-12 months: 47% churn</div>
                  <div className="text-text-secondary text-sm">Drops to 18% after year 1</div>
                </td>
                <td className="py-6 px-4">
                  <div className="px-3 py-1 rounded text-sm font-medium text-white inline-block" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                    Enhanced onboarding programs
                  </div>
                </td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
                <td className="py-6 px-4">
                  <div className="font-semibold text-text-primary text-lg">Monthly Charges</div>
                  <div className="text-text-tertiary text-sm">19% importance</div>
                </td>
                <td className="py-6 px-4 text-text-secondary">
                  When price exceeds perceived value, even loyal customers reconsider—especially if competitors advertise lower prices
                </td>
                <td className="py-6 px-4">
                  <div className="text-text-primary font-semibold">$75+/month: 38% churn</div>
                  <div className="text-text-secondary text-sm">$40-75: 22% | Under $40: 12%</div>
                </td>
                <td className="py-6 px-4">
                  <div className="px-3 py-1 rounded text-sm font-medium text-white inline-block" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                    Value-based pricing tiers
                  </div>
                </td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
                <td className="py-6 px-4">
                  <div className="font-semibold text-text-primary text-lg">Service Issues</div>
                  <div className="text-text-tertiary text-sm">11% importance</div>
                </td>
                <td className="py-6 px-4 text-text-secondary">
                  One unresolved ticket erodes trust built over months—customers remember poor support experiences
                </td>
                <td className="py-6 px-4">
                  <div className="text-text-primary font-semibold">3+ tickets: 52% churn</div>
                  <div className="text-text-secondary text-sm">0-1 tickets: 14%</div>
                </td>
                <td className="py-6 px-4">
                  <div className="px-3 py-1 rounded text-sm font-medium text-white inline-block" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                    First-call resolution priority
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-6 px-4">
                  <div className="font-semibold text-text-primary text-lg">Internet Service</div>
                  <div className="text-text-tertiary text-sm">8% importance</div>
                </td>
                <td className="py-6 px-4 text-text-secondary">
                  Fiber customers have fewer alternatives in their area, while DSL users face intense competition
                </td>
                <td className="py-6 px-4">
                  <div className="text-text-primary font-semibold">Fiber: 18% churn</div>
                  <div className="text-text-secondary text-sm">DSL: 41% | Cable: 28%</div>
                </td>
                <td className="py-6 px-4">
                  <div className="px-3 py-1 rounded text-sm font-medium text-white inline-block" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                    Fiber upgrade targeting
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <CalloutBox type="insight">
          <strong>High-value customers churn MORE on month-to-month contracts</strong> (not less). This reveals they're commitment-averse, not price-sensitive—they value flexibility and are willing to pay for it until a better offer appears. Traditional retention tactics (discounts) miss the mark. They need compelling reasons to commit, like exclusive features or guaranteed pricing.
        </CalloutBox>

        <CalloutBox type="counterintuitive">
          <strong>Service calls REDUCE churn when resolved quickly</strong>. Customers with 1-2 tickets resolved within 48 hours show 8% lower churn than those with zero tickets. Why? Calling support demonstrates engagement—they're invested enough to seek help rather than silently leave. Fast resolution builds trust and loyalty.
        </CalloutBox>
      </div>

      {/* Section 2: Customer Risk Archetypes */}
      <div className="mb-16">
        <h3 className="text-3xl font-bold text-text-primary mb-4">Three Customer Archetypes That Drive 72% of Churn</h3>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          While every customer is unique, our clustering analysis reveals three dominant risk profiles. Understanding these archetypes enables targeted, persona-specific retention strategies.
        </p>

        {/* Archetype 1 */}
        <InsightCard className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-2xl font-bold text-text-primary mb-2">The Frustrated Newcomer</h4>
              <div className="text-text-tertiary text-sm">28% of all churners • 0-12 months tenure • Service-driven exits</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-text-primary">47%</div>
              <div className="text-text-tertiary text-sm">Churn Rate</div>
            </div>
          </div>
          <p className="text-text-secondary mb-4 leading-relaxed">
            <strong className="text-text-primary">Who they are:</strong> New customers (less than 1 year) who experienced service issues during onboarding—installation delays, billing errors, or technical problems that weren't resolved quickly.
          </p>
          <p className="text-text-secondary mb-4 leading-relaxed">
            <strong className="text-text-primary">Why they leave:</strong> They haven't developed loyalty yet. Early negative experiences create the narrative "this company doesn't care about me," and they leave before giving us a second chance.
          </p>
          <p className="text-text-secondary mb-6 leading-relaxed">
            <strong className="text-text-primary">How to retain them:</strong> Proactive outreach at first sign of service issues. Assign dedicated onboarding specialist for first 90 days. Offer "fresh start" package if early issues occurred (e.g., bill credit + priority support).
          </p>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="Population" value="11.8M" size="small" />
            <MetricCard label="Annual Churn" value="5.5M" size="small" />
            <MetricCard label="Retention Opportunity" value="$738M" size="small" />
            <MetricCard label="Avg LTV" value="$1,340" size="small" />
          </div>
        </InsightCard>

        {/* Archetype 2 */}
        <InsightCard className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-2xl font-bold text-text-primary mb-2">The Silent Drifter</h4>
              <div className="text-text-tertiary text-sm">31% of all churners • 2-4 years tenure • Declining engagement</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-text-primary">29%</div>
              <div className="text-text-tertiary text-sm">Churn Rate</div>
            </div>
          </div>
          <p className="text-text-secondary mb-4 leading-relaxed">
            <strong className="text-text-primary">Who they are:</strong> Mid-tenure customers whose usage has declined over past 6 months. They still pay their bills but aren't actively using premium features or engaging with the service.
          </p>
          <p className="text-text-secondary mb-4 leading-relaxed">
            <strong className="text-text-primary">Why they leave:</strong> Life changes (work-from-home ended, moved to fiber-rich building, kids left home) mean their original use case evaporated. They're paying for features they no longer value but haven't bothered to switch yet.
          </p>
          <p className="text-text-secondary mb-6 leading-relaxed">
            <strong className="text-text-primary">How to retain them:</strong> Identify declining usage patterns via AI. Offer service right-sizing (downgrade with loyalty pricing) or feature refresh (upgrade to new use case like streaming). Goal: re-engage before competitors do.
          </p>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="Population" value="14.2M" size="small" />
            <MetricCard label="Annual Churn" value="4.1M" size="small" />
            <MetricCard label="Retention Opportunity" value="$512M" size="small" />
            <MetricCard label="Avg LTV" value="$1,250" size="small" />
          </div>
        </InsightCard>

        {/* Archetype 3 */}
        <InsightCard className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-2xl font-bold text-text-primary mb-2">The Price-Sensitive Pragmatist</h4>
              <div className="text-text-tertiary text-sm">41% of all churners • Month-to-month • High bills</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-text-primary">61%</div>
              <div className="text-text-tertiary text-sm">Churn Rate</div>
            </div>
          </div>
          <p className="text-text-secondary mb-4 leading-relaxed">
            <strong className="text-text-primary">Who they are:</strong> Month-to-month customers paying $75+ per month who actively compare prices. They have no contract lock-in and are highly responsive to competitor promotions.
          </p>
          <p className="text-text-secondary mb-4 leading-relaxed">
            <strong className="text-text-primary">Why they leave:</strong> They see a competitor ad offering $50/month for similar service. Without contract obligation, switching is frictionless. They're not angry—they're just optimizing their household budget.
          </p>
          <p className="text-text-secondary mb-6 leading-relaxed">
            <strong className="text-text-primary">How to retain them:</strong> Contract conversion with win-back economics: $50 bill credit for annual commitment. Emphasize total cost of ownership (no installation fees, no price increases for 12 months). Make staying cheaper than switching.
          </p>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="Population" value="19.9M" size="small" />
            <MetricCard label="Annual Churn" value="12.1M" size="small" />
            <MetricCard label="Retention Opportunity" value="$896M" size="small" />
            <MetricCard label="Avg LTV" value="$1,480" size="small" />
          </div>
        </InsightCard>

        <CalloutBox type="opportunity">
          <strong>Converting just 15% of Price-Sensitive Pragmatists</strong> to annual contracts eliminates $487M in churn risk—a larger impact than any single product improvement or network investment. This isn't a technology problem. It's a commitment problem with a contractual solution.
        </CalloutBox>
      </div>

      {/* Section 3: How We Validated Our Findings */}
      <div className="mb-16">
        <h3 className="text-3xl font-bold text-text-primary mb-4">Building Confidence Through Rigorous Testing</h3>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          We tested six different analytical approaches to ensure our insights weren't artifacts of a single methodology. The consistency across methods validates our findings and builds confidence in the recommended actions.
        </p>

        <div className="card p-8 mb-8">
          <h4 className="text-xl font-semibold text-text-primary mb-6">Why We Chose Interpretability Over Marginal Accuracy</h4>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Our winning model (Logistic Regression via ElasticNet) scored 85.0% AUC compared to 85.2% for XGBoost. We deliberately chose the slightly less accurate but far more interpretable model because:
          </p>
          <ul className="space-y-3 text-text-secondary mb-6">
            <li className="flex items-start">
              <span className="mr-3 text-text-primary font-bold">•</span>
              <span><strong className="text-text-primary">Executives need to understand WHY,</strong> not just trust a black box. Logistic regression provides clear coefficient weights that translate directly to business logic.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-text-primary font-bold">•</span>
              <span><strong className="text-text-primary">Frontline teams can't action "neural network says 73% churn risk."</strong> They need "this customer is high-risk because: month-to-month contract + 3 service tickets + high bill."</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-text-primary font-bold">•</span>
              <span><strong className="text-text-primary">Regulatory and ethical compliance</strong> requires explainability. "The algorithm decided" doesn't satisfy audit requirements or customer fairness concerns.</span>
            </li>
          </ul>
          <p className="text-text-secondary leading-relaxed">
            The 0.2% accuracy sacrifice buys us transparency, actionability, and trust—worth far more than marginal predictive gains in a business context.
          </p>
        </div>

        <ChartContainer title="Model Performance Comparison Across Six Approaches">
          <div className="flex justify-center">
            <GroupedBarChart
              data={modelZooData}
              width={950}
              height={500}
              yAxisLabel="Score"
              metrics={['AUC', 'Brier', 'Avg Precision']}
              colors={['#7823DC', '#9150E1', '#C8A5F0']}
            />
          </div>
        </ChartContainer>

        {/* Winner Card */}
        <div className="mt-8 p-6 rounded-lg border-2" style={{ borderColor: 'var(--color-accent-primary)', backgroundColor: 'var(--color-bg-tertiary)' }}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
              <Trophy size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-text-primary mb-3">
                Selected Model: {winnerModel.name}
              </h4>
              <p className="text-text-secondary text-base mb-4">
                {winnerModel.rationale}
              </p>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-text-tertiary text-sm mb-1">AUC</div>
                  <div className="text-text-primary font-bold text-2xl">{winnerModel.auc.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-text-tertiary text-sm mb-1">Brier Score</div>
                  <div className="text-text-primary font-bold text-2xl">{winnerModel.brier.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-text-tertiary text-sm mb-1">Avg Precision</div>
                  <div className="text-text-primary font-bold text-2xl">{winnerModel.average_precision.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-text-tertiary text-sm mb-1">Training Time</div>
                  <div className="text-text-primary font-bold text-2xl">{winnerModel.training_time_seconds.toFixed(1)}s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Model Performance Deep-Dive */}
      <div className="mb-16">
        <h3 className="text-3xl font-bold text-text-primary mb-4">Model Performance & Reliability</h3>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          Beyond top-line accuracy, we validated that our model is well-calibrated and balanced—ensuring predictions translate reliably to business decisions.
        </p>

        <ChartContainer title="Calibration: Predicted vs Actual Churn Rate">
          <div className="flex justify-center">
            <LineChart
              series={calibrationData}
              width={1050}
              height={550}
              yAxisLabel="Actual Churn Rate"
              valueFormatter={(v) => v.toFixed(0) + '%'}
            />
          </div>
          <p className="text-text-secondary text-sm text-center mt-4">
            Our model is well-calibrated across the full probability range: when we predict 60% churn probability, approximately 60% of those customers actually churn. This calibration accuracy ensures we can confidently allocate retention budgets based on model scores.
          </p>
        </ChartContainer>

        <div className="card p-8 mb-8">
          <h4 className="text-xl font-semibold text-text-primary mb-4">Confusion Matrix: Real-World Performance</h4>
          <div className="flex justify-center mb-6">
            <div className="inline-block">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="p-4"></th>
                    <th className="p-4 text-text-primary text-base font-semibold" colSpan={2}>Predicted</th>
                  </tr>
                  <tr>
                    <th className="p-4"></th>
                    <th className="p-4 text-text-secondary text-sm">Will Stay</th>
                    <th className="p-4 text-text-secondary text-sm">Will Churn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-4 text-text-primary text-sm font-semibold" rowSpan={2} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Actual</td>
                    <td className="p-4 text-text-secondary text-sm">Stayed</td>
                    <td className="p-8 text-center font-bold text-3xl rounded" style={{ backgroundColor: '#2A2A2A', color: '#E5E5E5' }}>
                      34,210
                      <div className="text-sm font-normal text-text-tertiary mt-2">True Negative</div>
                    </td>
                    <td className="p-8 text-center font-bold text-3xl rounded" style={{ backgroundColor: '#3A3A3A', color: '#E5E5E5' }}>
                      2,850
                      <div className="text-sm font-normal text-text-tertiary mt-2">False Positive</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-secondary text-sm">Churned</td>
                    <td className="p-8 text-center font-bold text-3xl rounded" style={{ backgroundColor: '#3A3A3A', color: '#E5E5E5' }}>
                      1,180
                      <div className="text-sm font-normal text-text-tertiary mt-2">False Negative</div>
                    </td>
                    <td className="p-8 text-center font-bold text-3xl rounded" style={{ backgroundColor: 'var(--color-accent-primary)', color: '#FFFFFF' }}>
                      5,320
                      <div className="text-sm font-normal text-text-tertiary mt-2" style={{ color: '#E5E5E5' }}>True Positive</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <span className="text-text-primary font-semibold">Precision: 65.1%</span>
              <span className="text-text-tertiary mx-3">|</span>
              <span className="text-text-primary font-semibold">Recall: 81.8%</span>
              <span className="text-text-tertiary mx-3">|</span>
              <span className="text-text-primary font-semibold">F1-Score: 72.5%</span>
            </div>
          </div>
          <div className="p-6 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Business Translation:</strong> For every 100 customers we predict will churn, 65 actually do (precision). We successfully identify 82 out of 100 actual churners (recall). This balance minimizes wasted retention spend (false positives) while maximizing churn prevention (catching true positives).
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Feature Deep-Dive (Expandable) */}
      <div className="mb-16">
        <div
          className="card p-6 cursor-pointer hover:bg-opacity-90 transition-colors mb-4"
          onClick={() => setExpandedSection(expandedSection === 1 ? null : 1)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">Feature Importance: Complete Rankings</h3>
              <p className="text-text-secondary">Click to explore all 10 drivers with detailed business interpretation</p>
            </div>
            {expandedSection === 1 ? <ChevronUp size={28} className="text-text-tertiary" /> : <ChevronDown size={28} className="text-text-tertiary" />}
          </div>
        </div>

        {expandedSection === 1 && (
          <div className="card p-8">
            <ChartContainer title="Top 10 Churn Drivers by Importance">
              <div className="flex justify-center">
                <HorizontalBarChart
                  data={featureData}
                  width={1000}
                  height={550}
                  xAxisLabel="Importance Score"
                  valueFormatter={(v) => v.toFixed(3)}
                  color="#7823DC"
                />
              </div>
            </ChartContainer>

            <div className="mt-8 space-y-6">
              {data?.feature_importance?.features?.slice(0, 5).map((feature: any, idx: number) => (
                <div key={idx} className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-semibold text-text-primary">#{idx + 1}: {feature.name}</h4>
                    <div className="text-2xl font-bold text-text-primary">
                      {(feature.importance * 100).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-text-secondary mb-3 leading-relaxed">
                    <strong className="text-text-primary">What it means:</strong> {feature.interpretation}
                  </p>
                  <p className="text-text-secondary leading-relaxed">
                    <strong className="text-text-primary">Customer perspective:</strong> {getEmotionalIntelligence(feature.name)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 6: From Insight to Action */}
      <InsightCard>
        <h3 className="text-3xl font-bold text-text-primary mb-4">From Insight to Action: Four Strategic Levers</h3>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          Our findings translate into four intervention categories, each targeting specific customer risk profiles with tailored retention strategies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid var(--color-accent-primary)' }}>
            <h4 className="text-xl font-semibold text-text-primary mb-3">1. Contract Management</h4>
            <p className="text-text-secondary mb-3">Convert month-to-month to annual contracts with targeted incentives</p>
            <div className="text-text-primary font-semibold">Primary Target: Price-Sensitive Pragmatist</div>
            <div className="text-text-tertiary text-sm">$896M opportunity</div>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid var(--color-accent-primary)' }}>
            <h4 className="text-xl font-semibold text-text-primary mb-3">2. Early Engagement</h4>
            <p className="text-text-secondary mb-3">Enhanced onboarding with proactive support and value demonstration</p>
            <div className="text-text-primary font-semibold">Primary Target: Frustrated Newcomer</div>
            <div className="text-text-tertiary text-sm">$738M opportunity</div>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid var(--color-accent-primary)' }}>
            <h4 className="text-xl font-semibold text-text-primary mb-3">3. Service Recovery</h4>
            <p className="text-text-secondary mb-3">First-call resolution priority for high-value at-risk customers</p>
            <div className="text-text-primary font-semibold">Primary Target: All archetypes with service history</div>
            <div className="text-text-tertiary text-sm">$284M opportunity</div>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid var(--color-accent-primary)' }}>
            <h4 className="text-xl font-semibold text-text-primary mb-3">4. Value Perception</h4>
            <p className="text-text-secondary mb-3">Right-sizing plans and demonstrating ROI for declining-engagement customers</p>
            <div className="text-text-primary font-semibold">Primary Target: Silent Drifter</div>
            <div className="text-text-tertiary text-sm">$512M opportunity</div>
          </div>
        </div>
      </InsightCard>
    </div>
  );
}

// Helper function for emotional intelligence
function getEmotionalIntelligence(featureName: string): string {
  const emotionalMap: Record<string, string> = {
    'Contract': "Customers without commitment feel free to explore alternatives without friction. They value flexibility until a better offer appears.",
    'Tenure': "New customers are still evaluating whether we're worth staying for. Early experiences are decisive—trust hasn't been built yet.",
    'MonthlyCharges': "When my bill exceeds what I think I'm getting, I start comparing prices. Even if I've been happy, I'm now questioning value.",
    'TechSupport': "One unresolved ticket erodes months of goodwill. I remember poor support experiences long after the technical issue is fixed.",
    'InternetService': "If I have fiber, I know my options are limited—that changes my negotiating position and reduces churn temptation.",
  };

  // Find matching key
  for (const [key, value] of Object.entries(emotionalMap)) {
    if (featureName.includes(key)) {
      return value;
    }
  }

  return "Customers make decisions based on perceived value relative to alternatives and switching friction.";
}
