# ChurnIQ - Technical Specification

**Version:** 1.0
**Date:** October 27, 2025
**Author:** Claude Code Orchestrator - Architect Agent

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Tab Specifications](#tab-specifications)
5. [D3.js Chart Specifications](#d3js-chart-specifications)
6. [Scenario Calculator Specifications](#scenario-calculator-specifications)
7. [Data Schema Specifications](#data-schema-specifications)
8. [API Specifications](#api-specifications)
9. [Build & Deployment](#build--deployment)
10. [Testing Specifications](#testing-specifications)
11. [Performance Requirements](#performance-requirements)

---

## Project Overview

### Purpose
Executive demo application showcasing AI-powered churn prediction and retention strategy optimization for TeleVantage (fictional #7 US telecom carrier, 47.3M subscribers).

### Target Audience
C-suite executives (CEO, CFO, CMO) - non-technical stakeholders

### Key Features
- 5-tab SPA (Executive Dashboard, Scenario Planner, AI Workflow, Analytics, Segments)
- 7+ D3.js custom visualizations (dark theme compliant)
- 3 interactive scenario simulators with real-time calculations
- Static demo data scaled 6,714x from real churn analysis
- Kearney dark theme design system

---

## Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "d3": "^7.8.5",
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "vitest": "^1.0.4",
    "playwright": "^1.40.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Version Requirements
- Node.js: 18.x or 20.x
- npm: 9.x or 10.x
- TypeScript: 5.x
- React: 18.2+

---

## Application Structure

### Directory Structure

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component with routing
├── vite-env.d.ts           # Vite type declarations
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx       # App header with navigation
│   │   ├── TabNavigation.tsx # Tab switching component
│   │   └── Footer.tsx       # App footer (optional)
│   │
│   ├── shared/
│   │   ├── KPICard.tsx      # Reusable KPI display card
│   │   ├── Modal.tsx        # Modal component for drill-downs
│   │   ├── Slider.tsx       # Scenario slider input
│   │   ├── NumberInput.tsx  # Number input for assumptions
│   │   └── ChartContainer.tsx # Wrapper for D3 charts
│   │
│   └── charts/
│       ├── DonutChart.tsx   # Risk distribution donut
│       ├── WaterfallChart.tsx # Churn economics waterfall
│       ├── GroupedBarChart.tsx # Model comparison
│       ├── LineChart.tsx    # Churn by tenure
│       ├── ROICurve.tsx     # Budget optimization curve
│       ├── CalibrationPlot.tsx # Predicted vs actual
│       ├── FeatureImportance.tsx # Horizontal bar chart
│       └── SegmentHeatmap.tsx # Interactive heatmap
│
├── tabs/
│   ├── ExecutiveDashboard.tsx  # Tab 1: Dashboard
│   ├── ScenarioPlanner.tsx     # Tab 2: What-If Scenarios
│   ├── AgenticWorkflow.tsx     # Tab 3: AI Workflow
│   ├── ModelingDeepDive.tsx    # Tab 4: Analytics
│   └── SegmentExplorer.tsx     # Tab 5: Segment Heatmap
│
├── utils/
│   ├── scenarioCalculators.ts  # ROI calculation functions
│   ├── formatters.ts           # Number/currency formatters
│   ├── dataLoaders.ts          # JSON data loading
│   └── d3Helpers.ts            # D3.js utility functions
│
├── context/
│   └── AppContext.tsx          # Global state (assumptions, data)
│
├── data/                       # Static JSON files
│   ├── segments.json           # 54 segments
│   ├── models.json             # 6 model comparison
│   ├── metrics.json            # Performance metrics
│   ├── customers_summary.json  # Customer stats
│   ├── risk_distribution.json  # Risk aggregates
│   └── feature_importance.json # Top 10 drivers
│
├── types/
│   ├── data.ts                # Data type definitions
│   └── charts.ts              # Chart type definitions
│
└── styles/
    └── index.css              # Tailwind imports + global styles
```

---

## Tab Specifications

### Tab 1: Executive Dashboard

**Route:** `/` or `/dashboard`
**Component:** `ExecutiveDashboard.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Hero KPIs (4 cards in grid)                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │Customer  │ │Annual    │ │AI        │ │Model     │        │
│ │Base      │ │Churn Cost│ │Opportunity│ │AUC      │        │
│ │47.3M     │ │$1.42B    │ │$312M     │ │85%      │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│ Charts (2-column grid)                                      │
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Risk Distribution    │ │ Churn Economics     │          │
│ │ (Donut Chart)        │ │ (Waterfall Chart)   │          │
│ └──────────────────────┘ └──────────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│ Strategic Recommendations (3 cards)                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│ │Rec #1    │ │Rec #2    │ │Rec #3    │                    │
│ │Impact: H │ │Impact: M │ │Impact: M │                    │
│ │Effort: M │ │Effort: L │ │Effort: H │                    │
│ └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

**Data Requirements:**
- `metrics.json`: Base metrics (customer count, churn cost, opportunity)
- `risk_distribution.json`: Risk level breakdowns
- `customers_summary.json`: Customer statistics

**Interactions:**
- Hover on KPI cards → Show trend or detail
- Hover on donut chart segments → Show percentage and customer count
- Hover on waterfall bars → Show exact dollar amounts
- Click recommendation → Expand for details

---

### Tab 2: Scenario Planner

**Route:** `/scenarios`
**Component:** `ScenarioPlanner.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Global Economic Assumptions Panel (collapsible)             │
│ ARPU: $65  LTV: 36mo  Margin: 45%  Winback: 30%  IRR: 10%  │
├─────────────────────────────────────────────────────────────┤
│ Scenario A: Contract Conversion                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Slider: M2M Conversion Rate [0───●───30%]            │   │
│ │ Input: Incentive Cost per Conversion [$50]            │   │
│ │                                                       │   │
│ │ Live Outputs:                                         │   │
│ │ • M2M Population Change: -2.3M customers              │   │
│ │ • Churn Rate Reduction: 12.5% → 9.8%                 │   │
│ │ • Annual Savings: $87M                                │   │
│ │ • Implementation Cost: $115M                          │   │
│ │ • Net ROI: -24% (Year 1), +42% (3-year)              │   │
│ │ • Payback Period: 18 months                           │   │
│ │                                                       │   │
│ │ Chart: Before/After Churn by Contract Type (Bar)     │   │
│ └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Scenario B: Onboarding Excellence (similar structure)       │
├─────────────────────────────────────────────────────────────┤
│ Scenario C: Budget Optimization (similar structure)         │
└─────────────────────────────────────────────────────────────┘
```

**Calculation Logic:**

**Scenario A: Contract Conversion**
```typescript
interface ContractConversionInputs {
  conversionRate: number; // 0-0.30 (0% to 30%)
  incentiveCost: number;  // $ per customer
  assumptions: GlobalAssumptions;
}

function calculateContractConversion(inputs: ContractConversionInputs) {
  const m2mCustomers = 47300000 * 0.42; // 42% are M2M
  const conversions = m2mCustomers * inputs.conversionRate;
  const newM2M = m2mCustomers - conversions;

  // M2M churn rate: 25%, 1yr churn rate: 12%, 2yr churn rate: 5%
  const oldChurnCount = m2mCustomers * 0.25 + (47300000 * 0.35) * 0.12 + (47300000 * 0.23) * 0.05;
  const newChurnCount = newM2M * 0.25 + (47300000 * 0.35 + conversions) * 0.12 + (47300000 * 0.23) * 0.05;

  const churnReduction = oldChurnCount - newChurnCount;
  const annualSavings = churnReduction * inputs.assumptions.arpu * 12;
  const implementationCost = conversions * inputs.incentiveCost;

  const netYear1 = annualSavings - implementationCost;
  const net3Year = (annualSavings * 3) - implementationCost;
  const roi1Year = (netYear1 / implementationCost) * 100;
  const roi3Year = (net3Year / implementationCost) * 100;
  const paybackMonths = implementationCost / (annualSavings / 12);

  return {
    conversions,
    newM2MPopulation: newM2M,
    oldChurnRate: (oldChurnCount / 47300000) * 100,
    newChurnRate: (newChurnCount / 47300000) * 100,
    annualSavings,
    implementationCost,
    netYear1,
    net3Year,
    roi1Year,
    roi3Year,
    paybackMonths
  };
}
```

**Scenario B: Onboarding Excellence**
```typescript
interface OnboardingInputs {
  churnReduction: number; // 0-0.50 (0% to 50% reduction)
  programInvestment: number; // $ millions
  assumptions: GlobalAssumptions;
}

function calculateOnboardingExcellence(inputs: OnboardingInputs) {
  const earlyTenureCustomers = 47300000 * 0.18; // 18% are 0-12 months
  const baselineChurnRate = 0.35; // 35% early churn
  const newChurnRate = baselineChurnRate * (1 - inputs.churnReduction);

  const churnReduction = earlyTenureCustomers * (baselineChurnRate - newChurnRate);
  const annualSavings = churnReduction * inputs.assumptions.arpu * 12;
  const ltvIncrease = churnReduction * inputs.assumptions.arpu * inputs.assumptions.ltv;

  const npv3Year = calculateNPV([
    -inputs.programInvestment * 1000000, // Year 0
    annualSavings,                        // Year 1
    annualSavings,                        // Year 2
    annualSavings                         // Year 3
  ], inputs.assumptions.discountRate);

  const roiMultiple = (annualSavings * 3) / (inputs.programInvestment * 1000000);

  return {
    earlyTenureCustomers,
    baselineChurnRate: baselineChurnRate * 100,
    newChurnRate: newChurnRate * 100,
    churnReduction,
    annualSavings,
    ltvIncrease,
    npv3Year,
    roiMultiple
  };
}
```

**Scenario C: Budget Optimization**
```typescript
interface BudgetOptimizationInputs {
  retentionBudget: number; // $50M - $500M
  costPerIntervention: number; // $10 - $100
  assumptions: GlobalAssumptions;
}

function calculateBudgetOptimization(inputs: BudgetOptimizationInputs) {
  const maxInterventions = (inputs.retentionBudget * 1000000) / inputs.costPerIntervention;
  const atRiskCustomers = 47300000 * 0.26; // 26% targeted
  const targeted = Math.min(maxInterventions, atRiskCustomers);

  // Diminishing returns: Save rate decreases with scale
  const baselineSaveRate = 0.30; // 30% baseline winback
  const saveRateAdjustment = 1 - (targeted / atRiskCustomers) * 0.2; // -20% at 100% coverage
  const effectiveSaveRate = baselineSaveRate * saveRateAdjustment;

  const customersSaved = targeted * effectiveSaveRate;
  const revenue = customersSaved * inputs.assumptions.arpu * 12;
  const cost = targeted * inputs.costPerIntervention;
  const netProfit = revenue - cost;
  const roi = (netProfit / cost) * 100;

  return {
    targeted,
    customersSaved,
    saveRate: effectiveSaveRate * 100,
    revenue,
    cost,
    netProfit,
    roi,
    roiCurve: generateROICurve(inputs) // Array of points for chart
  };
}

function generateROICurve(inputs: BudgetOptimizationInputs) {
  const points = [];
  for (let budget = 50; budget <= 500; budget += 10) {
    const result = calculateBudgetOptimization({ ...inputs, retentionBudget: budget });
    points.push({ budget, roi: result.roi, netProfit: result.netProfit });
  }
  return points;
}
```

**Global Assumptions Interface:**
```typescript
interface GlobalAssumptions {
  arpu: number;           // Average Revenue Per User (monthly)
  ltv: number;            // Customer Lifetime Value (months)
  margin: number;         // Gross margin (0-1)
  winbackRate: number;    // Intervention success rate (0-1)
  discountRate: number;   // Discount rate for NPV (0-1)
}

const defaultAssumptions: GlobalAssumptions = {
  arpu: 65,
  ltv: 36,
  margin: 0.45,
  winbackRate: 0.30,
  discountRate: 0.10
};
```

---

### Tab 3: Agentic AI Workflow

**Route:** `/workflow`
**Component:** `AgenticWorkflow.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Workflow Diagram (SVG or styled HTML)                       │
│                                                              │
│   ┌─────────────┐                                           │
│   │ Data Agent  │ → Analyzes 47.3M customers, identifies    │
│   │             │   54 segments (tenure × contract × value) │
│   └──────┬──────┘                                           │
│          ↓                                                   │
│   ┌─────────────┐                                           │
│   │  ML Agent   │ → Trains 6 models in parallel            │
│   │             │   Selects Logistic Regression (AUC 0.85)  │
│   └──────┬──────┘                                           │
│          ↓                                                   │
│   ┌─────────────┐                                           │
│   │ Strategy    │ → Optimizes thresholds per segment        │
│   │   Agent     │   Generates retention strategies          │
│   └──────┬──────┘                                           │
│          ↓                                                   │
│   ┌─────────────┐                                           │
│   │  QA Agent   │ → Validates results, approves for prod    │
│   │             │   31/31 tests pass, 69% coverage          │
│   └─────────────┘                                           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Kearney Differentiation Callout                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Traditional Approach:                                 │   │
│ │ • 12-week engagement                                  │   │
│ │ • Static Excel models                                 │   │
│ │ • One-time insights                                   │   │
│ │ • $2M cost                                            │   │
│ │                                                       │   │
│ │ Kearney + AI:                                         │   │
│ │ • 2-week deployment                                   │   │
│ │ • Real-time intelligence                              │   │
│ │ • Continuous optimization                             │   │
│ │ • $500K cost                                          │   │
│ │                                                       │   │
│ │ Result: 6x faster, 4x cheaper, higher accuracy       │   │
│ └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Value Proposition                                            │
│ "AI handles 80% of analysis work → consultants focus on     │
│  strategic recommendations"                                  │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
- **Workflow diagram:** SVG with arrows and agent boxes
- **Agent descriptions:** Expandable cards with inputs/outputs
- **Comparison table:** Traditional vs AI-enabled approach
- **Static content:** No interactivity required

---

### Tab 4: Modeling & Analytics Deep-Dive

**Route:** `/analytics`
**Component:** `ModelingDeepDive.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Section 4A: Model Zoo Comparison                            │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Table: 6 models ranked by AUC                         │   │
│ │ Chart: Grouped bar chart (AUC, Brier, AP)            │   │
│ │ Winner highlight: LR with rationale                   │   │
│ └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Section 4B: Performance Metrics                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ AUC Explanation (business language)                   │   │
│ │ Calibration Plot (D3.js scatter + diagonal)           │   │
│ │ Confusion Matrix with business labels                 │   │
│ └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Section 4C: Feature Importance                              │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Top 10 churn drivers (horizontal bar chart)           │   │
│ │ Business interpretation for each                      │   │
│ └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Section 4D: Profit Optimization                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Profit curve (threshold vs profit)                    │   │
│ │ Explanation: Why 26% targeting rate is optimal        │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Data Requirements:**
- `models.json`: 6 model comparison
- `metrics.json`: Performance metrics
- `feature_importance.json`: Top 10 drivers

---

### Tab 5: Segment Explorer

**Route:** `/segments`
**Component:** `SegmentExplorer.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Segment Heatmap (D3.js interactive)                         │
│                                                              │
│ Y-axis: Contract Type (M2M, 1yr, 2yr)                       │
│ X-axis: Tenure Band (0-3m, 4-12m, 13-24m, 25-48m, 49-72m)  │
│                                                              │
│ ┌───────┬───────┬───────┬───────┬───────┐                  │
│ │       │       │       │       │       │                  │
│ │  M2M  │ ● RED │ ● RED │ ○ YEL │ ○ GRN │                  │
│ │       │       │       │       │       │                  │
│ ├───────┼───────┼───────┼───────┼───────┤                  │
│ │       │       │       │       │       │                  │
│ │  1yr  │ ● YEL │ ○ YEL │ ○ GRN │ ○ GRN │                  │
│ │       │       │       │       │       │                  │
│ ├───────┼───────┼───────┼───────┼───────┤                  │
│ │       │       │       │       │       │                  │
│ │  2yr  │ ○ GRN │ ○ GRN │ ○ GRN │ ○ GRN │                  │
│ │       │       │       │       │       │                  │
│ └───────┴───────┴───────┴───────┴───────┘                  │
│                                                              │
│ Color: Churn Probability (Green → Yellow → Red)             │
│ Size: Customer Count (larger bubble = more customers)       │
│                                                              │
│ Click segment → Modal with details                          │
└─────────────────────────────────────────────────────────────┘
```

**Modal Content (on click):**
```
┌───────────────────────────────────────────────────┐
│ Segment: 4-12m, M2M, High Value                   │
├───────────────────────────────────────────────────┤
│ Population: 2,604,072 customers (5.5% of base)    │
│ Avg Churn Probability: 42.3%                      │
│ Avg LTV: $1,872                                   │
│ Risk Level: VERY HIGH                             │
│                                                    │
│ Recommended Strategy:                             │
│ "Aggressive retention: Offer 6-month contract     │
│  upgrade with $100 incentive + premium support"   │
│                                                    │
│ Expected ROI: 215%                                │
│ Implementation Timeline: 2-3 months                │
│                                                    │
│ [Close]                                            │
└───────────────────────────────────────────────────┘
```

---

## D3.js Chart Specifications

### Chart 1: Donut Chart (Risk Distribution)

**Component:** `DonutChart.tsx`
**Data Source:** `risk_distribution.json`

**Visual Specifications:**
- Inner radius: 60px
- Outer radius: 120px
- Colors: Green (#10B981), Amber (#F59E0B), Red (#EF4444), Dark Red (#DC2626)
- Labels: Outside donut, white text, segment percentage
- Hover: Highlight segment, show tooltip with count

**Implementation:**
```typescript
interface RiskSegment {
  level: 'Low' | 'Medium' | 'High' | 'Very High';
  customers: number;
  percentage: number;
}

function DonutChart({ data }: { data: RiskSegment[] }) {
  const width = 300;
  const height = 300;
  const innerRadius = 60;
  const outerRadius = 120;

  const colorScale = d3.scaleOrdinal()
    .domain(['Low', 'Medium', 'High', 'Very High'])
    .range(['#10B981', '#F59E0B', '#EF4444', '#DC2626']);

  const pie = d3.pie<RiskSegment>()
    .value(d => d.customers)
    .sort(null);

  const arc = d3.arc<d3.PieArcDatum<RiskSegment>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  // ... D3 rendering logic
}
```

---

### Chart 2: Waterfall Chart (Churn Economics)

**Component:** `WaterfallChart.tsx`
**Data:** Calculated from metrics

**Bars:**
1. Baseline Loss: $1.42B (red, down)
2. AI Savings: $312M (green, up)
3. Residual Risk: $1.11B (red, final)

**Visual Specifications:**
- Bar width: 80px
- Gap: 40px
- Colors: Red (#EF4444) for losses, Green (#10B981) for savings
- Labels: Above/below bars with $ amounts
- Connectors: Dotted lines between bars

---

### Chart 3: Grouped Bar Chart (Model Comparison)

**Component:** `GroupedBarChart.tsx`
**Data Source:** `models.json`

**Groups:** 6 models (LR_en, CB, MLP, XGB, RF, LGB)
**Metrics:** AUC, Brier (inverted), Average Precision

**Visual Specifications:**
- Bar width: 20px per metric
- Group spacing: 60px
- Colors: Purple (#7823DC), Green (#10B981), Blue (#3B82F6)
- Y-axis: 0 to 1.0 (percentage scale)
- X-axis: Model names
- Legend: Top right

---

### Chart 4: Line Chart (Churn by Tenure)

**Component:** `LineChart.tsx`
**Data:** Segment data aggregated by tenure

**Lines:**
- M2M contract: Red line
- 1yr contract: Amber line
- 2yr contract: Green line

**Visual Specifications:**
- Line width: 2px
- Point markers: 5px radius
- X-axis: Tenure bands
- Y-axis: Churn rate (0-50%)
- Legend: Top right

---

### Chart 5: ROI Curve (Budget Optimization)

**Component:** `ROICurve.tsx`
**Data:** Generated by scenario calculator

**Visual Specifications:**
- Line: Purple gradient (#7823DC)
- Area fill: Purple with 20% opacity
- Optimal point: Highlighted with green dot + vertical line
- X-axis: Budget ($50M - $500M)
- Y-axis: ROI (%)
- Annotation: "Optimal: $280M budget, 142% ROI"

---

### Chart 6: Calibration Plot (Predicted vs Actual)

**Component:** `CalibrationPlot.tsx`
**Data Source:** `metrics.json` (calibration data)

**Visual Specifications:**
- Scatter points: Purple (#7823DC), 4px radius, 50% opacity
- Diagonal line: White dashed (perfect calibration)
- X-axis: Predicted churn probability (0-100%)
- Y-axis: Actual churn rate (0-100%)
- Grid: No gridlines (clean axes only)

---

### Chart 7: Feature Importance (Horizontal Bar)

**Component:** `FeatureImportance.tsx`
**Data Source:** `feature_importance.json`

**Visual Specifications:**
- Bar height: 30px
- Spacing: 10px
- Color: Purple (#7823DC)
- Labels: Left-aligned feature names (white)
- Values: Right-aligned importance scores (light gray)
- Sort: Descending by importance

---

### Chart 8: Segment Heatmap (Interactive)

**Component:** `SegmentHeatmap.tsx`
**Data Source:** `segments.json`

**Visual Specifications:**
- Cell size: 100px × 100px
- Color scale: Green (#10B981) → Yellow (#F59E0B) → Red (#EF4444)
- Bubble size: Proportional to customer count (10px - 80px)
- Labels: Contract types (Y), Tenure bands (X)
- Interaction: Click → Open modal with segment details

**Color Scale:**
```typescript
const colorScale = d3.scaleLinear<string>()
  .domain([0, 0.25, 0.50])
  .range(['#10B981', '#F59E0B', '#EF4444']);
```

---

## Data Schema Specifications

### segments.json

```json
{
  "segments": [
    {
      "tenure_band": "0-3m",
      "contract_group": "M2M",
      "value_tier": "High",
      "customers": 2604072,
      "churn_probability": 0.423,
      "threshold": 0.25,
      "targeted_customers": 2603680,
      "targeting_rate": 0.997,
      "avg_ltv": 1872,
      "risk_level": "Very High",
      "strategy": "Aggressive retention: Offer 6-month contract upgrade with $100 incentive + premium support",
      "expected_roi": 2.15,
      "implementation_timeline": "2-3 months"
    }
    // ... 53 more segments
  ]
}
```

### models.json

```json
{
  "models": [
    {
      "name": "Logistic Regression (ElasticNet)",
      "abbrev": "LR_en",
      "auc": 0.8500,
      "brier": 0.1340,
      "average_precision": 0.6656,
      "training_time_seconds": 3.96,
      "winner": true,
      "rationale": "Best AUC, interpretable coefficients, fast inference"
    }
    // ... 5 more models
  ]
}
```

### metrics.json

```json
{
  "overview": {
    "total_customers": 47300000,
    "annual_churn_cost": 1420000000,
    "ai_opportunity": 312000000,
    "model_auc": 0.8500
  },
  "calibration": {
    "bins": [
      { "predicted": 0.05, "actual": 0.048 },
      { "predicted": 0.15, "actual": 0.152 },
      // ... 10 bins total
    ]
  },
  "confusion_matrix": {
    "true_positives": 3894720,
    "false_positives": 1641880,
    "true_negatives": 39122400,
    "false_negatives": 2641000
  }
}
```

### customers_summary.json

```json
{
  "by_contract": {
    "M2M": { "count": 19866000, "pct": 0.42 },
    "1yr": { "count": 16555000, "pct": 0.35 },
    "2yr": { "count": 10879000, "pct": 0.23 }
  },
  "by_tenure": {
    "0-3m": { "count": 4257000, "pct": 0.09 },
    "4-12m": { "count": 8514000, "pct": 0.18 },
    "13-24m": { "count": 9460000, "pct": 0.20 },
    "25-48m": { "count": 11838000, "pct": 0.25 },
    "49-72m": { "count": 13231000, "pct": 0.28 }
  },
  "by_value": {
    "Low": { "count": 11619000, "pct": 0.246 },
    "Med": { "count": 14663000, "pct": 0.310 },
    "High": { "count": 21011000, "pct": 0.444 }
  }
}
```

### risk_distribution.json

```json
{
  "risk_levels": [
    { "level": "Low", "customers": 18920000, "percentage": 0.40 },
    { "level": "Medium", "customers": 14190000, "percentage": 0.30 },
    { "level": "High", "customers": 9460000, "percentage": 0.20 },
    { "level": "Very High", "customers": 4730000, "percentage": 0.10 }
  ]
}
```

### feature_importance.json

```json
{
  "features": [
    { "name": "Contract Type", "importance": 0.287, "interpretation": "Month-to-month contracts 5x more likely to churn" },
    { "name": "Tenure", "importance": 0.219, "interpretation": "Customers with <12 months tenure highest risk" },
    { "name": "Monthly Charges", "importance": 0.156, "interpretation": "High bills ($75+) correlate with churn" },
    { "name": "Total Charges", "importance": 0.098, "interpretation": "Low lifetime value indicates early churn risk" },
    { "name": "Tech Support Calls", "importance": 0.085, "interpretation": "3+ calls in 90 days signals dissatisfaction" },
    { "name": "Payment Method", "importance": 0.064, "interpretation": "Electronic check users churn 2x more" },
    { "name": "Internet Service", "importance": 0.041, "interpretation": "Fiber users churn less than DSL" },
    { "name": "Online Security", "importance": 0.023, "interpretation": "No security add-ons = higher churn" },
    { "name": "Streaming Services", "importance": 0.019, "interpretation": "No streaming subscriptions = lower engagement" },
    { "name": "Paperless Billing", "importance": 0.008, "interpretation": "Minimal impact on churn" }
  ]
}
```

---

## API Specifications

### No External APIs

This is a static demo application with no backend API calls.

### Internal Functions

**Data Loading:**
```typescript
// src/utils/dataLoaders.ts
export async function loadSegments(): Promise<Segment[]> {
  const response = await fetch('/src/data/segments.json');
  return response.json();
}

export async function loadModels(): Promise<Model[]> {
  const response = await fetch('/src/data/models.json');
  return response.json();
}
```

**Scenario Calculators:**
```typescript
// src/utils/scenarioCalculators.ts
export function calculateContractConversion(
  conversionRate: number,
  incentiveCost: number,
  assumptions: GlobalAssumptions
): ContractConversionResult;

export function calculateOnboardingExcellence(
  churnReduction: number,
  programInvestment: number,
  assumptions: GlobalAssumptions
): OnboardingResult;

export function calculateBudgetOptimization(
  retentionBudget: number,
  costPerIntervention: number,
  assumptions: GlobalAssumptions
): BudgetOptimizationResult;
```

---

## Build & Deployment

### Build Configuration

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          d3: ['d3']
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
```

**amplify.yml:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

---

## Testing Specifications

### Unit Tests (Vitest)

**Test Coverage Targets:**
- Scenario calculators: 100%
- Chart components: 80%
- Tab components: 60%

**Example Test:**
```typescript
// tests/unit/scenarioCalculators.test.ts
import { calculateContractConversion } from '@/utils/scenarioCalculators';

describe('calculateContractConversion', () => {
  it('calculates ROI correctly for 20% conversion', () => {
    const result = calculateContractConversion(0.20, 50, defaultAssumptions);
    expect(result.roi1Year).toBeCloseTo(-24, 1);
    expect(result.roi3Year).toBeCloseTo(42, 1);
    expect(result.paybackMonths).toBeCloseTo(18, 1);
  });
});
```

### E2E Tests (Playwright)

**Test Scenarios:**
1. Navigate to all 5 tabs successfully
2. Adjust scenario sliders and verify calculations update
3. Click segment in heatmap and verify modal opens
4. Verify charts render without errors

---

## Performance Requirements

### Lighthouse Targets
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >80

### Load Time Targets
- Initial page load: <3 seconds
- Tab switch: <300ms
- Chart render: <1 second
- Scenario recalculation: <100ms

### Bundle Size Targets
- Total bundle: <500KB gzipped
- Vendor chunk: <200KB
- D3 chunk: <150KB
- Main app: <150KB

---

## Conclusion

This technical specification provides comprehensive implementation details for ChurnIQ. All components, charts, calculations, and data structures are fully specified and ready for development.

**Next Phase:** Data Engineering (Generate scaled demo data)
