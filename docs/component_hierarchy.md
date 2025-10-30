# ChurnIQ Churn Intelligence Platform - Component Hierarchy

**Version:** 1.0
**Date:** October 27, 2025
**Architect:** Claude Code Orchestrator

---

## Component Tree

```
App (Router, Context Provider)
│
├── Header
│   ├── Logo
│   └── TabNavigation
│       ├── Tab (Dashboard)
│       ├── Tab (Scenarios)
│       ├── Tab (Workflow)
│       ├── Tab (Analytics)
│       └── Tab (Segments)
│
├── Routes
│   │
│   ├── /dashboard (Executive Dashboard)
│   │   ├── HeroKPIs
│   │   │   ├── KPICard (Customer Base)
│   │   │   ├── KPICard (Churn Cost)
│   │   │   ├── KPICard (AI Opportunity)
│   │   │   └── KPICard (Model AUC)
│   │   ├── RiskDistribution
│   │   │   └── DonutChart
│   │   ├── ChurnEconomics
│   │   │   └── WaterfallChart
│   │   └── Recommendations
│   │       ├── RecommendationCard (Rec #1)
│   │       ├── RecommendationCard (Rec #2)
│   │       └── RecommendationCard (Rec #3)
│   │
│   ├── /scenarios (Scenario Planner)
│   │   ├── GlobalAssumptions
│   │   │   ├── NumberInput (ARPU)
│   │   │   ├── NumberInput (LTV)
│   │   │   ├── NumberInput (Margin)
│   │   │   ├── NumberInput (Winback Rate)
│   │   │   └── NumberInput (Discount Rate)
│   │   ├── ScenarioA (Contract Conversion)
│   │   │   ├── Slider (Conversion Rate)
│   │   │   ├── NumberInput (Incentive Cost)
│   │   │   ├── MetricsDisplay
│   │   │   └── BarChart (Before/After)
│   │   ├── ScenarioB (Onboarding Excellence)
│   │   │   ├── Slider (Churn Reduction)
│   │   │   ├── NumberInput (Program Investment)
│   │   │   ├── MetricsDisplay
│   │   │   └── LineChart (Churn by Tenure)
│   │   └── ScenarioC (Budget Optimization)
│   │       ├── Slider (Retention Budget)
│   │       ├── NumberInput (Cost per Intervention)
│   │       ├── MetricsDisplay
│   │       └── ROICurve
│   │
│   ├── /workflow (Agentic AI Workflow)
│   │   ├── WorkflowDiagram
│   │   │   ├── AgentNode (Data Agent)
│   │   │   ├── AgentNode (ML Agent)
│   │   │   ├── AgentNode (Strategy Agent)
│   │   │   └── AgentNode (QA Agent)
│   │   ├── DifferentiationCallout
│   │   └── ValueProposition
│   │
│   ├── /analytics (Modeling Deep-Dive)
│   │   ├── Section4A (Model Zoo)
│   │   │   ├── ModelComparisonTable
│   │   │   ├── GroupedBarChart (AUC/Brier/AP)
│   │   │   └── WinnerHighlight
│   │   ├── Section4B (Performance Metrics)
│   │   │   ├── AUCExplanation
│   │   │   ├── CalibrationPlot
│   │   │   └── ConfusionMatrix
│   │   ├── Section4C (Feature Importance)
│   │   │   ├── FeatureImportance (Horizontal Bar Chart)
│   │   │   └── BusinessInterpretations
│   │   └── Section4D (Profit Optimization)
│   │       ├── ProfitCurve
│   │       └── ThresholdRationale
│   │
│   └── /segments (Segment Explorer)
│       ├── SegmentHeatmap
│       │   ├── XAxis (Tenure Bands)
│       │   ├── YAxis (Contract Types)
│       │   └── HeatmapCells (54 segments)
│       │       └── (on click) → SegmentModal
│       └── SegmentModal
│           ├── ModalHeader
│           ├── SegmentDetails
│           │   ├── PopulationMetric
│           │   ├── ChurnProbability
│           │   ├── AvgLTV
│           │   └── RiskLevel
│           ├── StrategyRecommendation
│           └── ModalFooter (Close button)
│
└── Footer (optional)
```

---

## Component Specifications

### Layout Components

#### App
**File:** `src/App.tsx`
**Purpose:** Root component with routing and global state
**Props:** None
**State:** Global assumptions, loaded data
**Children:** Header, Routes, Footer

```typescript
interface AppState {
  assumptions: GlobalAssumptions;
  data: {
    segments: Segment[];
    models: Model[];
    metrics: Metrics;
    // ... other data
  };
}
```

#### Header
**File:** `src/components/layout/Header.tsx`
**Purpose:** App header with logo and navigation
**Props:** None
**Children:** Logo, TabNavigation

#### TabNavigation
**File:** `src/components/layout/TabNavigation.tsx`
**Purpose:** Tab switching component
**Props:** activeTab
**Children:** Tab buttons (5)

---

### Shared Components

#### KPICard
**File:** `src/components/shared/KPICard.tsx`
**Purpose:** Display single KPI with label, value, and trend
**Props:**
```typescript
interface KPICardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  formatter?: (value: number) => string;
}
```

**Usage:**
```tsx
<KPICard
  label="Customer Base"
  value={47300000}
  formatter={(v) => `${(v / 1000000).toFixed(1)}M`}
  trend={{ value: 2.1, direction: 'up' }}
/>
```

#### Slider
**File:** `src/components/shared/Slider.tsx`
**Purpose:** Input slider for scenario parameters
**Props:**
```typescript
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatter?: (value: number) => string;
}
```

#### NumberInput
**File:** `src/components/shared/NumberInput.tsx`
**Purpose:** Editable number input for assumptions
**Props:**
```typescript
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string; // e.g., "$"
  suffix?: string; // e.g., "%"
  min?: number;
  max?: number;
}
```

#### Modal
**File:** `src/components/shared/Modal.tsx`
**Purpose:** Modal dialog for segment details
**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
```

#### ChartContainer
**File:** `src/components/shared/ChartContainer.tsx`
**Purpose:** Wrapper for D3 charts with title and loading state
**Props:**
```typescript
interface ChartContainerProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
}
```

---

### Chart Components

#### DonutChart
**File:** `src/components/charts/DonutChart.tsx`
**Purpose:** Risk distribution donut chart
**Props:**
```typescript
interface DonutChartProps {
  data: RiskSegment[];
  width?: number;
  height?: number;
}
```

**D3 Implementation:**
- Inner radius: 60px, Outer radius: 120px
- Color scale: Risk level → Color mapping
- Labels: Outside donut with percentages
- Tooltip: Customer count on hover

#### WaterfallChart
**File:** `src/components/charts/WaterfallChart.tsx`
**Purpose:** Churn economics waterfall
**Props:**
```typescript
interface WaterfallChartProps {
  data: WaterfallBar[];
  width?: number;
  height?: number;
}

interface WaterfallBar {
  label: string;
  value: number;
  type: 'loss' | 'gain' | 'total';
}
```

#### GroupedBarChart
**File:** `src/components/charts/GroupedBarChart.tsx`
**Purpose:** Model comparison (AUC, Brier, AP)
**Props:**
```typescript
interface GroupedBarChartProps {
  data: Model[];
  metrics: string[]; // ['auc', 'brier', 'average_precision']
  width?: number;
  height?: number;
}
```

#### LineChart
**File:** `src/components/charts/LineChart.tsx`
**Purpose:** Churn rate by tenure band
**Props:**
```typescript
interface LineChartProps {
  data: LineChartData[];
  width?: number;
  height?: number;
}

interface LineChartData {
  x: string; // Tenure band
  y: number; // Churn rate
  series: string; // Contract type
}
```

#### ROICurve
**File:** `src/components/charts/ROICurve.tsx`
**Purpose:** Budget optimization ROI curve
**Props:**
```typescript
interface ROICurveProps {
  data: ROIPoint[];
  optimalPoint: { budget: number; roi: number };
  width?: number;
  height?: number;
}
```

#### CalibrationPlot
**File:** `src/components/charts/CalibrationPlot.tsx`
**Purpose:** Predicted vs actual churn (scatter + diagonal)
**Props:**
```typescript
interface CalibrationPlotProps {
  data: CalibrationBin[];
  width?: number;
  height?: number;
}
```

#### FeatureImportance
**File:** `src/components/charts/FeatureImportance.tsx`
**Purpose:** Horizontal bar chart of top 10 drivers
**Props:**
```typescript
interface FeatureImportanceProps {
  data: Feature[];
  width?: number;
  height?: number;
}

interface Feature {
  name: string;
  importance: number;
  interpretation: string;
}
```

#### SegmentHeatmap
**File:** `src/components/charts/SegmentHeatmap.tsx`
**Purpose:** Interactive heatmap (tenure × contract × value)
**Props:**
```typescript
interface SegmentHeatmapProps {
  data: Segment[];
  onSegmentClick: (segment: Segment) => void;
  width?: number;
  height?: number;
}
```

---

### Tab Components

#### ExecutiveDashboard
**File:** `src/tabs/ExecutiveDashboard.tsx`
**Purpose:** Tab 1 - Dashboard with KPIs, charts, recommendations
**Data:** metrics.json, risk_distribution.json
**Components:** KPICard (4), DonutChart, WaterfallChart, RecommendationCard (3)

#### ScenarioPlanner
**File:** `src/tabs/ScenarioPlanner.tsx`
**Purpose:** Tab 2 - Interactive what-if scenarios
**State:**
```typescript
interface ScenarioPlannerState {
  assumptions: GlobalAssumptions;
  scenarioA: ContractConversionInputs;
  scenarioB: OnboardingInputs;
  scenarioC: BudgetOptimizationInputs;
}
```
**Components:** GlobalAssumptions, Scenario A/B/C sections

#### AgenticWorkflow
**File:** `src/tabs/AgenticWorkflow.tsx`
**Purpose:** Tab 3 - Static AI workflow diagram
**Components:** WorkflowDiagram, DifferentiationCallout, ValueProposition

#### ModelingDeepDive
**File:** `src/tabs/ModelingDeepDive.tsx`
**Purpose:** Tab 4 - Model comparison and analytics
**Data:** models.json, metrics.json, feature_importance.json
**Components:** Section4A, Section4B, Section4C, Section4D

#### SegmentExplorer
**File:** `src/tabs/SegmentExplorer.tsx`
**Purpose:** Tab 5 - Interactive segment heatmap
**State:**
```typescript
interface SegmentExplorerState {
  selectedSegment: Segment | null;
  isModalOpen: boolean;
}
```
**Components:** SegmentHeatmap, SegmentModal

---

## Component Communication

### Data Flow

```
AppContext (Global State)
   │
   ├─► ExecutiveDashboard
   │   └─► Reads: metrics, risk_distribution
   │
   ├─► ScenarioPlanner
   │   ├─► Reads: assumptions, customers_summary
   │   └─► Updates: assumptions (editable)
   │
   ├─► AgenticWorkflow
   │   └─► Static (no data reads)
   │
   ├─► ModelingDeepDive
   │   └─► Reads: models, metrics, feature_importance
   │
   └─► SegmentExplorer
       └─► Reads: segments
```

### Event Flow

```
User adjusts slider (Scenario A)
   │
   ├─► Slider.onChange fires
   │   └─► Updates: scenarioA.conversionRate
   │
   ├─► useEffect detects state change
   │   └─► Calls: calculateContractConversion()
   │
   ├─► Updates: scenarioA results
   │
   └─► BarChart re-renders with new data
```

---

## Reusable Patterns

### Lazy Loading
```typescript
const ExecutiveDashboard = lazy(() => import('./tabs/ExecutiveDashboard'));
const ScenarioPlanner = lazy(() => import('./tabs/ScenarioPlanner'));
// ... etc
```

### Memoization
```typescript
// Expensive calculations
const calculatedResults = useMemo(() => {
  return calculateContractConversion(inputs);
}, [inputs]);

// Chart components
export default React.memo(DonutChart);
```

### Custom Hooks
```typescript
// useDataLoader.ts
export function useDataLoader<T>(path: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    fetch(path).then(r => r.json()).then(setData);
  }, [path]);
  return data;
}

// Usage
const segments = useDataLoader<Segment[]>('/src/data/segments.json');
```

---

## Styling Patterns

### Tailwind Classes
```tsx
// Card
className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6"

// Heading
className="text-xl font-semibold text-white mb-4"

// Body text
className="text-base text-[#E5E5E5]"

// Button
className="bg-[#7823DC] hover:bg-[#8B3EED] text-white font-medium px-6 py-3 rounded-md"
```

---

## Component Size Estimates

| Component | Lines of Code | Complexity |
|-----------|---------------|------------|
| App | 150 | Medium |
| Header | 50 | Low |
| KPICard | 40 | Low |
| Slider | 60 | Low |
| NumberInput | 50 | Low |
| Modal | 70 | Low |
| DonutChart | 200 | High |
| WaterfallChart | 180 | High |
| GroupedBarChart | 160 | Medium |
| LineChart | 140 | Medium |
| ROICurve | 150 | Medium |
| CalibrationPlot | 130 | Medium |
| FeatureImportance | 120 | Low |
| SegmentHeatmap | 250 | High |
| ExecutiveDashboard | 200 | Medium |
| ScenarioPlanner | 350 | High |
| AgenticWorkflow | 100 | Low |
| ModelingDeepDive | 250 | Medium |
| SegmentExplorer | 180 | Medium |

**Total Estimated:** ~2,800 lines of React/TypeScript code

---

## Development Order

**Phase 1: Foundation (Week 1, Days 1-2)**
1. App shell with routing
2. Header and tab navigation
3. Shared components (KPICard, Slider, NumberInput, Modal)
4. Design system (Tailwind config)

**Phase 2: Charts (Week 1, Days 3-5)**
5. ChartContainer wrapper
6. DonutChart
7. WaterfallChart
8. GroupedBarChart
9. LineChart
10. FeatureImportance

**Phase 3: Tabs (Week 2, Days 1-3)**
11. ExecutiveDashboard
12. ScenarioPlanner (with calculators)
13. AgenticWorkflow
14. ModelingDeepDive

**Phase 4: Advanced Features (Week 2, Days 4-5)**
15. SegmentHeatmap
16. SegmentExplorer with modal
17. ROICurve
18. CalibrationPlot

**Phase 5: Polish (Week 2, Days 6-7)**
19. Performance optimization
20. Accessibility improvements
21. Cross-browser testing
22. Bug fixes

---

This component hierarchy provides a clear roadmap for implementation with well-defined responsibilities and interfaces for each component.
