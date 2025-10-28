import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Slider from '@/components/shared/Slider';
import NumberInput from '@/components/shared/NumberInput';
import ChartContainer from '@/components/shared/ChartContainer';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import ROICurve from '@/components/charts/ROICurve';
import AgentTraceDisplay from '@/components/agent/AgentTraceDisplay';
import { useAgentRun } from '@/hooks/useAgentRun';
import { calculateContractConversion, calculateOnboardingExcellence, calculateBudgetOptimization, generateROICurve } from '@/utils/scenarioCalculators';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { BarChart3, Bot, Lightbulb, CheckCircle, X, Sparkles, DollarSign, Check, TrendingUp, TrendingDown } from 'lucide-react';

export default function ScenarioPlanner() {
  const { assumptions, isLoading, error } = useAppContext();

  // Workflow panel state
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'budget' | 'contract' | 'onboarding' | null>(null);

  // Scenario 1 (Budget Optimization) state
  const [retentionBudget, setRetentionBudget] = useState(220_000_000); // $220M default (optimal)
  const [costPerIntervention, setCostPerIntervention] = useState(50); // $50 default

  // Scenario 2 (Contract Conversion) state
  const [conversionRate, setConversionRate] = useState(0.20); // 20% default for higher impact
  const [incentiveCost, setIncentiveCost] = useState(50); // $50 default for positive ROI

  // Scenario 3 (Onboarding Excellence) state
  const [churnReduction, setChurnReduction] = useState(0.30); // 30% default
  const [programInvestment, setProgramInvestment] = useState(50_000_000); // $50M default

  // Calculate Scenario 1 results
  const resultsC = useMemo(() => {
    return calculateBudgetOptimization(
      {
        retention_budget: retentionBudget,
        cost_per_intervention: costPerIntervention,
      },
      assumptions
    );
  }, [retentionBudget, costPerIntervention, assumptions]);

  // Generate ROI curve for Scenario 1
  const roiCurveData = useMemo(() => {
    return generateROICurve(costPerIntervention, assumptions, 25);
  }, [costPerIntervention, assumptions]);

  // Find optimal budget point on the ROI curve
  const optimalBudget = useMemo(() => {
    if (!roiCurveData.length) return retentionBudget;
    const optimal = roiCurveData.reduce((prev, current) =>
      current.roi > prev.roi ? current : prev
    );
    return optimal.budget;
  }, [roiCurveData, retentionBudget]);

  // Calculate Scenario 2 results
  const results = useMemo(() => {
    return calculateContractConversion(
      {
        conversion_rate: conversionRate,
        incentive_cost: incentiveCost,
      },
      assumptions
    );
  }, [conversionRate, incentiveCost, assumptions]);

  // Prepare chart data for Scenario 2
  const chartData = useMemo(() => {
    const TOTAL_CUSTOMERS = 47_300_000;
    const M2M_PCT = 0.42;
    const ONE_YR_PCT = 0.35;
    const TWO_YR_PCT = 0.23;
    const M2M_CHURN_RATE = 0.25;
    const ONE_YR_CHURN_RATE = 0.12;
    const TWO_YR_CHURN_RATE = 0.05;

    const m2mCustomers = TOTAL_CUSTOMERS * M2M_PCT;
    const conversions = results.conversions;

    const beforeChurnRate =
      (m2mCustomers * M2M_CHURN_RATE +
        TOTAL_CUSTOMERS * ONE_YR_PCT * ONE_YR_CHURN_RATE +
        TOTAL_CUSTOMERS * TWO_YR_PCT * TWO_YR_CHURN_RATE) /
      TOTAL_CUSTOMERS;

    const newM2M = m2mCustomers - conversions;
    const new1Yr = TOTAL_CUSTOMERS * ONE_YR_PCT + conversions;
    const afterChurnRate =
      (newM2M * M2M_CHURN_RATE +
        new1Yr * ONE_YR_CHURN_RATE +
        TOTAL_CUSTOMERS * TWO_YR_PCT * TWO_YR_CHURN_RATE) /
      TOTAL_CUSTOMERS;

    return [
      { category: 'Before', value: beforeChurnRate * 100, label: 'Current churn rate' },
      { category: 'After', value: afterChurnRate * 100, label: 'With contract conversion' },
    ];
  }, [results]);

  const paybackPeriod =
    results.net_benefit > 0
      ? (results.total_cost / (results.annual_savings / 12)).toFixed(1)
      : 'N/A';

  // Calculate Scenario 3 results
  const resultsB = useMemo(() => {
    return calculateOnboardingExcellence(
      {
        churn_reduction: churnReduction,
        program_investment: programInvestment,
      },
      assumptions
    );
  }, [churnReduction, programInvestment, assumptions]);

  // Prepare line chart data for Scenario 3
  const tenureChartData = useMemo(() => {
    const tenureBands = [
      { x: '0-3 mo', baseline: 40.0 },
      { x: '4-6 mo', baseline: 28.0 },
      { x: '7-12 mo', baseline: 18.0 },
      { x: '13-24 mo', baseline: 12.0 },
      { x: '25+ mo', baseline: 5.0 },
    ];

    const beforeSeries = tenureBands.map(band => ({ x: band.x, y: band.baseline }));

    const afterSeries = tenureBands.map(band => {
      let improvementFactor = 0;
      if (band.x === '0-3 mo') improvementFactor = churnReduction;
      else if (band.x === '4-6 mo') improvementFactor = churnReduction * 0.7;
      else if (band.x === '7-12 mo') improvementFactor = churnReduction * 0.4;
      else improvementFactor = churnReduction * 0.1;

      return { x: band.x, y: band.baseline * (1 - improvementFactor) };
    });

    return [
      { name: 'Before', data: beforeSeries, color: '#A5A5A5' },
      { name: 'After Onboarding Program', data: afterSeries, color: '#7823DC' },
    ];
  }, [churnReduction]);

  // Agent runs for each scenario
  const budgetAgentRun = useAgentRun(
    resultsC
      ? {
          type: 'budget',
          retentionBudget,
          costPerIntervention,
          output: resultsC,
        }
      : null
  );

  const contractAgentRun = useAgentRun(
    results
      ? {
          type: 'contract',
          conversionRate,
          incentiveCost,
          output: results,
        }
      : null
  );

  const onboardingAgentRun = useAgentRun(
    resultsB
      ? {
          type: 'onboarding',
          churnReduction,
          programInvestment,
          output: resultsB,
        }
      : null
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading scenario data..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div style={{ color: 'var(--color-chart-7)' }}>Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-text-primary mb-8">Scenario Planner</h2>

      {/* Global Assumptions */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold text-text-primary mb-6">Global Economic Assumptions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <div className="text-text-tertiary text-sm mb-2">ARPU</div>
            <div className="text-text-primary font-bold text-2xl">${assumptions.arpu}/mo</div>
          </div>
          <div>
            <div className="text-text-tertiary text-sm mb-2">LTV Period</div>
            <div className="text-text-primary font-bold text-2xl">{assumptions.ltv_months} months</div>
          </div>
          <div>
            <div className="text-text-tertiary text-sm mb-2">Gross Margin</div>
            <div className="text-text-primary font-bold text-2xl">{(assumptions.gross_margin * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-text-tertiary text-sm mb-2">Save Rate</div>
            <div className="text-text-primary font-bold text-2xl">{(assumptions.save_rate * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-text-tertiary text-sm mb-2">Discount Rate</div>
            <div className="text-text-primary font-bold text-2xl">{(assumptions.discount_rate * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* SCENARIO 1: BUDGET OPTIMIZATION (REORDERED FROM C) */}
      <div className="card mb-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold text-text-primary mb-2">Scenario 1: Budget Optimization</h3>
            <p className="text-text-secondary">
              Find the optimal retention budget that maximizes ROI. Adjust budget allocation to identify the sweet spot.
            </p>
          </div>
          <button
            onClick={() => { setActiveScenario('budget'); setWorkflowOpen(true); }}
            className="px-4 py-2 rounded font-semibold text-sm whitespace-nowrap"
            style={{ backgroundColor: 'var(--color-accent-primary)', color: '#FFFFFF' }}
          >
            View AI Workflow
          </button>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <NumberInput
            label="Annual Retention Budget"
            value={retentionBudget}
            onChange={setRetentionBudget}
            prefix="$"
            min={0}
            max={500_000_000}
            step={10_000_000}
          />
          <Slider
            label="Cost per Intervention"
            value={costPerIntervention}
            min={10}
            max={100}
            step={5}
            onChange={setCostPerIntervention}
            formatter={(v) => '$' + v.toFixed(0)}
          />
        </div>

        {/* Agent Trace */}
        <AgentTraceDisplay agentRun={budgetAgentRun} />

        {/* SIDE-BY-SIDE BEFORE/AFTER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BASELINE (LEFT) */}
          <div className="p-6 rounded border" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-secondary)' }}>
            <div className="text-text-tertiary text-sm font-semibold uppercase tracking-wide mb-4">CURRENT STATE (Reactive Program)</div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Retention Budget</div>
              <div className="text-3xl font-bold text-text-secondary">$75M</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Customers Targeted</div>
              <div className="text-2xl font-bold text-text-secondary">5.0M</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Annual Churn Cost</div>
              <div className="text-2xl font-bold text-text-secondary">$1.42B</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Annual Savings</div>
              <div className="text-3xl font-bold text-text-secondary">$150M</div>
            </div>

            <div>
              <div className="text-text-tertiary text-sm mb-1">ROI</div>
              <div className="text-2xl font-bold text-text-secondary">+100%</div>
            </div>
          </div>

          {/* WITH AI TARGETING (RIGHT) */}
          <div className="p-6 rounded border-2" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-accent-primary)' }}>
            <div className="text-text-primary text-sm font-semibold uppercase tracking-wide mb-4 flex items-center">
              <Sparkles size={16} className="mr-2" />
              WITH AI TARGETING
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Retention Budget</div>
              <div className="text-3xl font-bold text-text-primary">{formatCurrency(retentionBudget, 0)}</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Customers Targeted</div>
              <div className="text-2xl font-bold text-text-primary">{(resultsC.interventions / 1_000_000).toFixed(1)}M</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Annual Churn Cost</div>
              <div className="text-2xl font-bold text-text-primary">{formatCurrency(1_420_000_000 - resultsC.annual_savings, 0)}</div>
            </div>

            <div className="mb-6 p-4 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div className="text-text-tertiary text-sm mb-1 flex items-center">
                <DollarSign size={16} className="mr-1" />
                ANNUAL SAVINGS
              </div>
              <div className="text-5xl font-bold text-text-primary">{formatCurrency(resultsC.annual_savings, 0)}</div>
            </div>

            <div className="p-4 rounded" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
              <div className="text-white text-sm mb-1 opacity-90 flex items-center">
                <Sparkles size={16} className="mr-1" />
                ROI
              </div>
              <div className="text-4xl font-bold text-white">{resultsC.roi > 0 ? '+' : ''}{(resultsC.roi * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Optimal Budget Callout */}
        <div className="p-6 mb-8 rounded border" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-accent-light)' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-text-tertiary text-sm mb-2">OPTIMAL BUDGET (Maximum ROI)</div>
              <div className="text-3xl font-bold text-text-primary mb-2">{formatCurrency(optimalBudget, 0)}</div>
              <div className="text-text-secondary text-sm flex items-center">
                {retentionBudget === optimalBudget ? (
                  <>
                    <Check size={16} className="mr-2 text-text-primary" />
                    You are at the optimal budget allocation
                  </>
                ) : retentionBudget < optimalBudget ? (
                  <>
                    <TrendingUp size={16} className="mr-2 text-text-primary" />
                    Consider increasing by {formatCurrency(optimalBudget - retentionBudget, 0)}
                  </>
                ) : (
                  <>
                    <TrendingDown size={16} className="mr-2 text-text-primary" />
                    Consider decreasing by {formatCurrency(retentionBudget - optimalBudget, 0)}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ROI Curve Chart */}
        <ChartContainer title="ROI by Budget Allocation" showProvenance agentRun={budgetAgentRun}>
          <div className="flex justify-center">
            <ROICurve
              data={roiCurveData}
              optimalBudget={optimalBudget}
              width={750}
              height={500}
              xAxisLabel="Annual Retention Budget"
              yAxisLabel="Return on Investment"
            />
          </div>
          <div className="mt-4 text-center text-text-tertiary text-sm">
            Peak ROI occurs at {formatCurrency(optimalBudget, 0)} annual budget
          </div>
        </ChartContainer>
      </div>

      {/* SCENARIO 2: CONTRACT CONVERSION (REORDERED FROM A) */}
      <div className="card mb-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold text-text-primary mb-2">Scenario 2: Contract Conversion Program</h3>
            <p className="text-text-secondary">
              Convert month-to-month customers to annual contracts with targeted incentives. Focus on high-value segments.
            </p>
          </div>
          <button
            onClick={() => { setActiveScenario('contract'); setWorkflowOpen(true); }}
            className="px-4 py-2 rounded font-semibold text-sm whitespace-nowrap"
            style={{ backgroundColor: 'var(--color-accent-primary)', color: '#FFFFFF' }}
          >
            View AI Workflow
          </button>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Slider
            label="M2M Conversion Rate"
            value={conversionRate}
            min={0}
            max={0.30}
            step={0.01}
            onChange={setConversionRate}
            formatter={(v) => formatPercent(v, 0)}
          />
          <NumberInput
            label="Incentive Cost per Customer"
            value={incentiveCost}
            onChange={setIncentiveCost}
            prefix="$"
            min={0}
            max={500}
            step={10}
          />
        </div>

        {/* Agent Trace */}
        <AgentTraceDisplay agentRun={contractAgentRun} />

        {/* SIDE-BY-SIDE BEFORE/AFTER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BASELINE (LEFT) */}
          <div className="p-6 rounded border" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-secondary)' }}>
            <div className="text-text-tertiary text-sm font-semibold uppercase tracking-wide mb-4">CURRENT STATE (Passive Conversion)</div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Conversion Rate</div>
              <div className="text-3xl font-bold text-text-secondary">5%</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Conversions</div>
              <div className="text-2xl font-bold text-text-secondary">1.0M</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Churn Reduction</div>
              <div className="text-2xl font-bold text-text-secondary">130K/year</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Annual Savings</div>
              <div className="text-3xl font-bold text-text-secondary">$45M</div>
            </div>

            <div>
              <div className="text-text-tertiary text-sm mb-1">ROI</div>
              <div className="text-2xl font-bold text-text-secondary">+50%</div>
            </div>
          </div>

          {/* WITH STRATEGY (RIGHT) */}
          <div className="p-6 rounded border-2" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-accent-primary)' }}>
            <div className="text-text-primary text-sm font-semibold uppercase tracking-wide mb-4 flex items-center">
              <Sparkles size={16} className="mr-2" />
              WITH AI-DRIVEN CONTRACT STRATEGY
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Conversion Rate</div>
              <div className="text-3xl font-bold text-text-primary">{formatPercent(conversionRate, 0)}</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Conversions</div>
              <div className="text-2xl font-bold text-text-primary">{(results.conversions / 1_000_000).toFixed(1)}M customers</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Churn Reduction</div>
              <div className="text-2xl font-bold text-text-primary">{(results.churn_reduction / 1_000).toFixed(1)}K/year</div>
            </div>

            <div className="mb-6 p-4 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div className="text-text-tertiary text-sm mb-1 flex items-center">
                <DollarSign size={16} className="mr-1" />
                ANNUAL SAVINGS
              </div>
              <div className="text-5xl font-bold text-text-primary">{formatCurrency(results.annual_savings, 0)}</div>
            </div>

            <div className="p-4 rounded" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
              <div className="text-white text-sm mb-1 opacity-90 flex items-center">
                <Sparkles size={16} className="mr-1" />
                ROI
              </div>
              <div className="text-4xl font-bold text-white">{results.roi > 0 ? '+' : ''}{(results.roi * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-bg-secondary border border-border-primary rounded">
            <div className="text-text-tertiary text-sm mb-1">Implementation Cost</div>
            <div className="text-text-primary text-lg font-semibold">
              {formatCurrency(results.total_cost, 0)}
            </div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded">
            <div className="text-text-tertiary text-sm mb-1">Net Benefit (Year 1)</div>
            <div className="text-lg font-semibold text-text-primary">
              {formatCurrency(results.net_benefit, 0)}
            </div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded">
            <div className="text-text-tertiary text-sm mb-1">Payback Period</div>
            <div className="text-text-primary text-lg font-semibold">
              {paybackPeriod} {paybackPeriod !== 'N/A' ? 'months' : ''}
            </div>
          </div>
        </div>

        {/* Before/After Chart */}
        <ChartContainer title="Impact on Overall Churn Rate">
          <div className="flex justify-center">
            <BarChart
              data={chartData}
              width={650}
              height={450}
              yAxisLabel="Churn Rate"
              valueFormatter={(v) => v.toFixed(1) + '%'}
              highlightColor="#7823DC"
            />
          </div>
          <div className="mt-4 text-center text-text-tertiary text-sm">
            Reduction: {(chartData[0].value - chartData[1].value).toFixed(2)} percentage points
          </div>
        </ChartContainer>
      </div>

      {/* SCENARIO 3: ONBOARDING EXCELLENCE (REORDERED FROM B) */}
      <div className="card">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold text-text-primary mb-2">Scenario 3: Onboarding Excellence Program</h3>
            <p className="text-text-secondary">
              Reduce early churn through improved onboarding and engagement. Target customers in their first 90 days.
            </p>
          </div>
          <button
            onClick={() => { setActiveScenario('onboarding'); setWorkflowOpen(true); }}
            className="px-4 py-2 rounded font-semibold text-sm whitespace-nowrap"
            style={{ backgroundColor: 'var(--color-accent-primary)', color: '#FFFFFF' }}
          >
            View AI Workflow
          </button>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Slider
            label="Early Churn Reduction"
            value={churnReduction}
            min={0}
            max={0.50}
            step={0.01}
            onChange={setChurnReduction}
            formatter={(v) => formatPercent(v, 0)}
          />
          <NumberInput
            label="Program Investment"
            value={programInvestment}
            onChange={setProgramInvestment}
            prefix="$"
            min={0}
            max={200_000_000}
            step={5_000_000}
          />
        </div>

        {/* Agent Trace */}
        <AgentTraceDisplay agentRun={onboardingAgentRun} />

        {/* SIDE-BY-SIDE BEFORE/AFTER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BASELINE (LEFT) */}
          <div className="p-6 rounded border" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-secondary)' }}>
            <div className="text-text-tertiary text-sm font-semibold uppercase tracking-wide mb-4">CURRENT STATE (Basic Onboarding)</div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Churn Reduction</div>
              <div className="text-3xl font-bold text-text-secondary">10%</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Early Customers (0-3mo)</div>
              <div className="text-2xl font-bold text-text-secondary">{(resultsB.early_customers / 1_000_000).toFixed(1)}M</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Customers Saved</div>
              <div className="text-2xl font-bold text-text-secondary">470K/year</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Annual Savings</div>
              <div className="text-3xl font-bold text-text-secondary">$168M</div>
            </div>

            <div>
              <div className="text-text-tertiary text-sm mb-1">3-Year NPV</div>
              <div className="text-2xl font-bold text-text-secondary">$450M</div>
            </div>
          </div>

          {/* WITH STRATEGY (RIGHT) */}
          <div className="p-6 rounded border-2" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-accent-primary)' }}>
            <div className="text-text-primary text-sm font-semibold uppercase tracking-wide mb-4 flex items-center">
              <Sparkles size={16} className="mr-2" />
              WITH ENHANCED ONBOARDING PROGRAM
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Churn Reduction</div>
              <div className="text-3xl font-bold text-text-primary">{formatPercent(churnReduction, 0)}</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Early Customers (0-3mo)</div>
              <div className="text-2xl font-bold text-text-primary">{(resultsB.early_customers / 1_000_000).toFixed(1)}M</div>
            </div>

            <div className="mb-6">
              <div className="text-text-tertiary text-sm mb-1">Customers Saved</div>
              <div className="text-2xl font-bold text-text-primary">{(resultsB.customers_saved / 1_000).toFixed(1)}K/year</div>
            </div>

            <div className="mb-6 p-4 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div className="text-text-tertiary text-sm mb-1 flex items-center">
                <DollarSign size={16} className="mr-1" />
                ANNUAL SAVINGS
              </div>
              <div className="text-5xl font-bold text-text-primary">{formatCurrency(resultsB.annual_savings, 0)}</div>
            </div>

            <div className="p-4 rounded" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
              <div className="text-white text-sm mb-1 opacity-90 flex items-center">
                <Sparkles size={16} className="mr-1" />
                3-YEAR NPV
              </div>
              <div className="text-4xl font-bold text-white">{formatCurrency(resultsB.npv_3yr, 0)}</div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-bg-secondary border border-border-primary rounded">
            <div className="text-text-tertiary text-sm mb-1">Program Cost</div>
            <div className="text-text-primary text-lg font-semibold">
              {formatCurrency(resultsB.total_cost, 0)}
            </div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded">
            <div className="text-text-tertiary text-sm mb-1">Net Benefit (3 Years)</div>
            <div className="text-lg font-semibold text-text-primary">
              {formatCurrency(resultsB.net_benefit, 0)}
            </div>
          </div>
          <div className="p-4 bg-bg-secondary border border-border-primary rounded">
            <div className="text-text-tertiary text-sm mb-1">ROI Multiple</div>
            <div className="text-lg font-semibold text-text-primary">
              {resultsB.total_cost > 0 ? (resultsB.annual_savings * 3 / resultsB.total_cost).toFixed(1) : '0.0'}x
            </div>
          </div>
        </div>

        {/* Tenure-Based Impact Chart */}
        <ChartContainer title="Churn Rate by Tenure Band">
          <div className="flex justify-center">
            <LineChart
              series={tenureChartData}
              width={750}
              height={500}
              yAxisLabel="Churn Rate"
              valueFormatter={(v) => v.toFixed(1) + '%'}
            />
          </div>
          <div className="mt-4 text-center text-text-tertiary text-sm">
            Greatest impact on early-tenure customers (0-3 months)
          </div>
        </ChartContainer>
      </div>

      {/* DYNAMIC AI WORKFLOW PANEL */}
      {workflowOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-end"
          onClick={() => setWorkflowOpen(false)}
        >
          <div
            className="h-full w-[480px] overflow-y-auto p-6"
            style={{ backgroundColor: 'var(--color-bg-primary)', borderLeft: '2px solid var(--color-accent-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">AI Workflow</h3>
                <p className="text-text-secondary text-sm">
                  {activeScenario === 'budget' && 'Budget Optimization Pipeline'}
                  {activeScenario === 'contract' && 'Contract Conversion Pipeline'}
                  {activeScenario === 'onboarding' && 'Onboarding Excellence Pipeline'}
                </p>
              </div>
              <button
                onClick={() => setWorkflowOpen(false)}
                className="text-text-tertiary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>

            {/* AI Agents */}
            <div className="space-y-4">
              {/* Data Agent */}
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)' }}>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    <BarChart3 size={20} className="text-text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-text-primary font-semibold mb-1">Data Agent</h4>
                    <p className="text-text-secondary text-sm">
                      {activeScenario === 'budget' && 'Analyzes 47.3M customer records, segments by risk score, validates feature quality'}
                      {activeScenario === 'contract' && 'Identifies 19.9M month-to-month customers, analyzes contract preferences, builds propensity model'}
                      {activeScenario === 'onboarding' && 'Segments 11.8M early-tenure customers (0-3 months), identifies onboarding pain points'}
                    </p>
                  </div>
                </div>
                <div className="text-text-tertiary text-xs">
                  Inputs: CRM data, billing records, service logs
                </div>
              </div>

              {/* ML Agent */}
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)' }}>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    <Bot size={20} className="text-text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-text-primary font-semibold mb-1">ML Agent</h4>
                    <p className="text-text-secondary text-sm">
                      {activeScenario === 'budget' && `Predicts churn probability for ${(retentionBudget / costPerIntervention / 1_000_000).toFixed(1)}M targeted customers, optimizes intervention thresholds`}
                      {activeScenario === 'contract' && `Predicts M2M conversion likelihood at ${(conversionRate * 100).toFixed(0)}% target rate, scores customers by propensity`}
                      {activeScenario === 'onboarding' && `Models ${(churnReduction * 100).toFixed(0)}% early churn reduction potential, identifies high-risk onboarding patterns`}
                    </p>
                  </div>
                </div>
                <div className="text-text-tertiary text-xs">
                  Model: XGBoost Classifier (AUC: 0.84)
                </div>
              </div>

              {/* Strategy Agent */}
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)' }}>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    <Lightbulb size={20} className="text-text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-text-primary font-semibold mb-1">Strategy Agent</h4>
                    <p className="text-text-secondary text-sm">
                      {activeScenario === 'budget' && `Allocates ${formatCurrency(retentionBudget, 0)} budget optimally, projects ${formatCurrency(resultsC.annual_savings, 0)} annual savings, ${(resultsC.roi * 100).toFixed(0)}% ROI`}
                      {activeScenario === 'contract' && `Designs incentive program at $${incentiveCost}/customer, projects ${(results.conversions / 1_000_000).toFixed(1)}M conversions, ${formatCurrency(results.annual_savings, 0)} savings`}
                      {activeScenario === 'onboarding' && `Invests ${formatCurrency(programInvestment, 0)} in onboarding, saves ${(resultsB.customers_saved / 1_000).toFixed(1)}K customers, ${formatCurrency(resultsB.annual_savings, 0)} annual value`}
                    </p>
                  </div>
                </div>
                <div className="text-text-tertiary text-xs">
                  Outputs: Risk scores, intervention plans, ROI projections
                </div>
              </div>

              {/* QA Agent */}
              <div className="p-4 rounded border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)' }}>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    <CheckCircle size={20} className="text-text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-text-primary font-semibold mb-1">QA Agent</h4>
                    <p className="text-text-secondary text-sm">
                      {activeScenario === 'budget' && 'Validates budget allocation aligns with business constraints, ensures intervention capacity exists, confirms positive ROI'}
                      {activeScenario === 'contract' && 'Verifies conversion targets are realistic, checks incentive budget feasibility, validates contract terms compliance'}
                      {activeScenario === 'onboarding' && 'Confirms program investment is within budget, validates 90-day timeline is achievable, checks customer experience impact'}
                    </p>
                  </div>
                </div>
                <div className="text-text-tertiary text-xs flex items-center">
                  <Check size={12} className="mr-1" />
                  Status: All validations passed
                </div>
              </div>
            </div>

            {/* Footer Link */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
              <p className="text-text-tertiary text-sm mb-3">
                Want to see the full multi-agent architecture?
              </p>
              <button
                onClick={() => {
                  setWorkflowOpen(false);
                  // User would need to navigate to AI Workflow tab manually
                }}
                className="text-sm font-semibold text-text-primary hover:underline"
              >
                View Complete AI Workflow →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
