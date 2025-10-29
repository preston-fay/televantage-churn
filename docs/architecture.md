# ChurnIQ - System Architecture

**Version:** 1.0
**Date:** October 27, 2025
**Architect:** Claude Code Orchestrator - Architect Agent
**Project:** Executive Demo Application

---

## Executive Summary

ChurnIQ (Turn Data Into Retention) is a single-page React application designed to showcase AI-powered churn prediction and retention strategy optimization for C-suite executives. The application presents scaled analytics from a real churn modeling project (telco-churn_v2) in an executive-friendly format with interactive scenario planning capabilities.

**Key Characteristics:**
- **Static demo application** (no live backend required)
- **Client-side computation** for real-time scenario calculations
- **D3.js visualizations** with Kearney dark theme compliance
- **AWS Amplify deployment** for global CDN delivery
- **5-tab structure** covering dashboard, scenarios, AI workflow, analytics, and segments

The architecture prioritizes **performance** (sub-second chart renders), **accessibility** (WCAG AA compliance), and **executive usability** (minimal cognitive load, clear insights).

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                              │
│                    (AWS Amplify Hosting)                            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   React SPA (Vite Build)                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐ │
│  │   5 Tabs     │   D3.js      │  Scenario    │   Static JSON    │ │
│  │ (Components) │  Charts (7+) │  Calculators │   Data Store     │ │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            React Context API (State Management)              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

Data Flow:
  1. User navigates between tabs → React Router updates view
  2. Tab component loads → Fetches data from static JSON
  3. D3.js chart renders → Reads data from React state
  4. User adjusts slider → Scenario calculator recalculates → Chart updates
```

### Architecture Pattern: JAMstack

**J**avaScript + **A**PIs + **M**arkup

- **JavaScript:** React 18 with TypeScript for interactive UI
- **APIs:** None (static JSON data, client-side calculations)
- **Markup:** Pre-rendered HTML with Vite build

**Benefits:**
- **Performance:** Served from CDN edge locations
- **Security:** No backend attack surface
- **Cost:** Minimal hosting costs (~$5/month)
- **Scalability:** CDN handles global traffic automatically

---

## Component Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  Tab Components: Executive, Scenarios, Workflow, Analytics,     │
│                  Segments                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    VISUALIZATION LAYER                          │
│  D3.js Charts: Donut, Waterfall, Bar, Line, Heatmap,           │
│                Calibration, ROI Curve                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                         │
│  Scenario Calculators: Contract, Onboarding, Budget            │
│  Economic Assumptions: ARPU, LTV, Margin, Discount Rate        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    DATA LAYER                                   │
│  Static JSON: Segments, Models, Metrics, Customers             │
│  Scaled from telco-churn_v2 (6,714x multiplier)                │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

See `component_hierarchy.md` for detailed React component tree.

---

## Technology Stack

### Frontend Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| **Framework** | React | 18.2+ | Industry standard, rich ecosystem, performant |
| **Language** | TypeScript | 5.0+ | Type safety, better DX, fewer runtime errors |
| **Build Tool** | Vite | 5.0+ | Fast HMR, optimized builds, modern tooling |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, design system enforcement |
| **Visualizations** | D3.js | 7.8+ | Full control for dark theme, custom interactions |
| **Routing** | React Router | 6.20+ | Tab navigation, URL state management |
| **State** | React Context | Built-in | Simple, no Redux overhead for demo app |

### Development Tools

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **ESLint** | Code linting | Catch errors, enforce style |
| **Prettier** | Code formatting | Consistent code style |
| **Vitest** | Unit testing | Vite-native, fast test runner |
| **Playwright** | E2E testing | Cross-browser testing |

### Deployment

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Hosting** | AWS Amplify | Simple static hosting, CI/CD integration |
| **CDN** | CloudFront | Global edge locations, low latency |
| **DNS** | Route 53 (optional) | AWS-native DNS management |

---

## Data Architecture

### Data Sources (Build-Time)

```
telco-churn_v2 Project
  ├── artifacts/model_leaderboard.csv       → Models comparison data
  ├── artifacts/complete_metrics.json       → Model performance metrics
  ├── artifacts/segment_optimal_thresholds.csv → Segment strategies
  └── results/scored_FIXED.csv             → Customer scoring results

         ↓ (Data Generation Script: scripts/generate_demo_data.py)

Static JSON Files (Demo Data)
  ├── src/data/segments.json              → 54 segments (aggregated)
  ├── src/data/models.json                → 6 models comparison
  ├── src/data/metrics.json               → Performance metrics (AUC, etc.)
  ├── src/data/customers_summary.json     → Customer distribution stats
  ├── src/data/risk_distribution.json     → Risk level aggregates
  └── src/data/feature_importance.json    → Top 10 churn drivers
```

### Data Scaling Methodology

**Base:** 7,044 customers (telco-churn_v2)
**Target:** 47,300,000 customers (TeleVantage)
**Scale Factor:** 6,714x

**Scaling Rules:**
1. **Customer counts:** Multiply by 6,714
2. **Percentages/rates:** Keep identical (churn rate, targeting rate)
3. **Financial metrics:** Scale by customer count (ARPU × customer count)
4. **Model metrics:** Keep identical (AUC 0.8500, Brier 0.134)
5. **Segment distributions:** Maintain original proportions

**Example:**
- Original segment: 493 customers, 90.1% targeted
- Scaled segment: 3,309,902 customers (493 × 6,714), 90.1% targeted
- Original segment revenue: 493 × $65 ARPU = $32,045/month
- Scaled segment revenue: 3,309,902 × $65 = $215M/month

---

## Integration Points

### External Integrations

**None required** - This is a fully static demo application.

### Internal Integrations

```
Tab Component ─────► React Context (Global State)
                            │
                            ├─► Static JSON Loader
                            ├─► Scenario Calculator Functions
                            └─► D3.js Chart Components

D3.js Charts ◄───── Chart Data (from React state)
                    └─► SVG Rendering (in DOM)

Scenario Sliders ───► Calculator Functions ───► Updated Metrics
                                                      │
                                                      └─► Chart Re-render
```

---

## Security Architecture

### Threat Model

**Risk Level:** LOW (demo application, no user data, no backend)

**Potential Threats:**
1. **XSS Attacks:** Mitigated by React's auto-escaping
2. **Content Injection:** Mitigated by CSP headers
3. **Data Tampering:** Not applicable (static data)
4. **Unauthorized Access:** Not applicable (public demo)

### Security Measures

1. **Content Security Policy (CSP)**
   ```
   Content-Security-Policy:
     default-src 'self';
     style-src 'self' 'unsafe-inline' fonts.googleapis.com;
     font-src 'self' fonts.gstatic.com;
     script-src 'self';
     img-src 'self' data:;
   ```

2. **HTTPS Enforcement**
   - CloudFront serves only HTTPS
   - HTTP → HTTPS redirect

3. **Dependency Security**
   - `npm audit` in CI/CD pipeline
   - Dependabot alerts enabled

4. **No Sensitive Data**
   - All data is fictional
   - No API keys, secrets, or credentials

---

## Performance Architecture

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Initial Load** | <3 seconds | Code splitting, lazy loading |
| **Tab Switch** | <300ms | Prefetch data, optimized renders |
| **Chart Render** | <1 second | D3.js optimization, canvas fallback |
| **Scenario Calc** | <100ms | Optimized JavaScript, memoization |
| **Lighthouse Score** | Performance >90 | Bundle optimization, image optimization |

### Optimization Strategies

1. **Code Splitting**
   ```typescript
   const ExecutiveDashboard = lazy(() => import('./tabs/ExecutiveDashboard'));
   const ScenarioPlanner = lazy(() => import('./tabs/ScenarioPlanner'));
   // ... lazy load each tab
   ```

2. **Asset Optimization**
   - Vite tree-shaking (removes unused code)
   - Terser minification (compress JavaScript)
   - Gzip/Brotli compression (CloudFront)

3. **Data Optimization**
   - Pre-aggregated segment data (54 segments vs 7M customers)
   - JSON minification (no whitespace)
   - Lazy data loading (load tab data on demand)

4. **Rendering Optimization**
   - React.memo() for chart components
   - useMemo() for expensive calculations
   - Debounced slider inputs (avoid excessive recalculations)

5. **D3.js Optimization**
   - Reuse SVG elements (don't recreate on every render)
   - Use requestAnimationFrame for smooth animations
   - Limit tooltip updates to mousemove throttling

---

## Deployment Architecture

### AWS Amplify Architecture

```
GitHub Repository
   │
   ├─ Push to main branch
   │
   ▼
AWS Amplify
   │
   ├─ Build (npm run build)
   │   ├─ Vite production build
   │   ├─ TypeScript compilation
   │   ├─ Tailwind CSS purge
   │   └─ Asset optimization
   │
   ├─ Deploy to S3
   │   └─ Upload build/ artifacts
   │
   └─ Distribute via CloudFront
       ├─ Edge caching (global)
       ├─ Gzip/Brotli compression
       └─ HTTPS termination

End User ◄─── CloudFront Edge Location (nearest)
```

### CI/CD Pipeline

**Trigger:** Push to `main` branch

**Steps:**
1. **Install:** `npm ci` (clean install)
2. **Lint:** `npm run lint` (ESLint)
3. **Test:** `npm run test` (Vitest)
4. **Build:** `npm run build` (Vite production build)
5. **Deploy:** Amplify uploads to S3 + invalidates CloudFront cache

**Duration:** ~3-5 minutes

---

## Scalability & Future Enhancements

### Current Limitations

1. **Static Data:** No live model inference
2. **No User Accounts:** Single-user demo
3. **Pre-calculated Scenarios:** Limited scenario customization
4. **No Backend:** Can't persist user preferences

### Future Enhancement Paths

#### Phase 2: Backend Integration (if needed)
- **Add FastAPI backend** for dynamic scenario calculations
- **PostgreSQL database** for storing custom scenarios
- **User authentication** (Auth0 or AWS Cognito)
- **API Gateway** for backend access

#### Phase 3: Live Model Inference
- **ML Model Serving:** Deploy model to SageMaker or Lambda
- **Real-time Scoring:** Score customers on-demand
- **Custom Thresholds:** Allow users to adjust segment thresholds

#### Phase 4: Multi-Tenancy
- **Client Isolation:** Separate data per client
- **Custom Branding:** White-label for different clients
- **Role-Based Access:** Different views for different roles

---

## Risk Assessment & Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **D3.js learning curve** | Medium | Low | Use examples, start simple, iterate |
| **Scaling data unrealistic** | Medium | Medium | Validate distributions match original |
| **Dark theme readability** | Low | High | Use white/gray text, high contrast testing |
| **Slow scenario calcs** | Low | Medium | Pre-calculate, optimize JavaScript |
| **Amplify deployment issues** | Low | Medium | Use proven amplify.yml, test early |
| **2-week timeline aggressive** | High | High | Orchestrator workflow, MVP first, polish later |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Browser compatibility** | Low | Low | Test on Chrome, Firefox, Safari, Edge |
| **Mobile performance** | Medium | Low | Desktop-first, mobile-friendly styling |
| **CDN costs spike** | Low | Low | Monitor usage, set billing alerts |

---

## Decision Records

### ADR-001: React vs Vue vs Angular

**Decision:** Use React
**Rationale:**
- Most popular (easier hiring, more resources)
- Rich ecosystem for D3.js integration
- TypeScript support excellent
- Vite works seamlessly with React

**Alternatives Considered:**
- **Vue 3:** Simpler learning curve, but smaller ecosystem
- **Angular:** Enterprise-ready, but overkill for demo app

**Trade-offs:**
- **Pro:** Large community, many examples
- **Con:** More boilerplate than Vue

---

### ADR-002: D3.js vs Chart.js vs Recharts

**Decision:** Use D3.js
**Rationale:**
- **Full control** over chart appearance (dark theme compliance)
- **Custom interactions** (heatmap drill-down)
- **NO gridlines** or unwanted styling
- **Professional** publication-quality visualizations

**Alternatives Considered:**
- **Chart.js:** Easier, but hard to remove gridlines
- **Recharts:** React-native, but limited customization

**Trade-offs:**
- **Pro:** Complete control, beautiful charts
- **Con:** Steeper learning curve, more code

---

### ADR-003: Static Data vs Live API

**Decision:** Static JSON data
**Rationale:**
- **Demo purposes only** (no live inference needed)
- **Faster performance** (no API latency)
- **Simpler deployment** (no backend infrastructure)
- **Predictable behavior** for presentations

**Alternatives Considered:**
- **FastAPI backend:** Dynamic calculations, but adds complexity
- **Serverless functions:** On-demand, but slower cold starts

**Trade-offs:**
- **Pro:** Simple, fast, cost-effective
- **Con:** No customization, no user persistence

---

### ADR-004: Tailwind CSS vs styled-components vs CSS Modules

**Decision:** Tailwind CSS
**Rationale:**
- **Utility-first** for rapid prototyping
- **Easy to enforce design system** (Kearney dark theme)
- **No CSS-in-JS overhead**
- **Consistent spacing/sizing**

**Alternatives Considered:**
- **styled-components:** Component-scoped, but runtime overhead
- **CSS Modules:** Scoped styles, but less productive

**Trade-offs:**
- **Pro:** Fast development, design system enforcement
- **Con:** HTML can get verbose with many classes

---

### ADR-005: AWS Amplify vs Vercel vs Netlify

**Decision:** AWS Amplify
**Rationale:**
- **Simple static hosting** for React SPAs
- **CI/CD integration** with GitHub
- **CloudFront CDN** for performance
- **Cost-effective** for demo projects (~$5/month)

**Alternatives Considered:**
- **Vercel:** Excellent DX, but slightly more expensive
- **Netlify:** Similar to Amplify, but we're already on AWS

**Trade-offs:**
- **Pro:** AWS ecosystem, CloudFront CDN, affordable
- **Con:** Slightly slower builds than Vercel

---

## Appendix A: System Diagrams

### Application Flow Diagram

```
User Opens App
   │
   ├─ React Router initializes
   │   └─ Default route: /dashboard
   │
   ▼
Load Executive Dashboard Tab
   │
   ├─ Fetch data: src/data/metrics.json
   ├─ Render 4 KPI cards
   ├─ Render donut chart (D3.js)
   ├─ Render waterfall chart (D3.js)
   └─ Render recommendations

User Clicks "Scenarios" Tab
   │
   ├─ React Router navigates to /scenarios
   │
   ▼
Load Scenario Planner Tab
   │
   ├─ Fetch data: src/data/customers_summary.json
   ├─ Initialize sliders (default values)
   ├─ Render Scenario A, B, C simulators
   └─ Render economic assumptions panel

User Adjusts Slider (Scenario A: Contract Conversion 20%)
   │
   ├─ Slider onChange event
   │   └─ Update React state: conversionRate = 0.20
   │
   ├─ useEffect triggers recalculation
   │   └─ calculateContractConversionROI(conversionRate, assumptions)
   │
   ├─ Update metrics state
   │   └─ { targetedCustomers, savings, roi, payback }
   │
   └─ D3.js chart re-renders with new data
```

---

## Appendix B: File Structure

```
televantage-churn-demo/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── shared/
│   │   │   ├── KPICard.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Slider.tsx
│   │   │   └── ChartContainer.tsx
│   │   └── charts/
│   │       ├── DonutChart.tsx
│   │       ├── WaterfallChart.tsx
│   │       ├── BarChart.tsx
│   │       ├── LineChart.tsx
│   │       ├── ROICurve.tsx
│   │       ├── CalibrationPlot.tsx
│   │       ├── FeatureImportance.tsx
│   │       └── SegmentHeatmap.tsx
│   ├── tabs/
│   │   ├── ExecutiveDashboard.tsx
│   │   ├── ScenarioPlanner.tsx
│   │   ├── AgenticWorkflow.tsx
│   │   ├── ModelingDeepDive.tsx
│   │   └── SegmentExplorer.tsx
│   ├── utils/
│   │   ├── scenarioCalculators.ts
│   │   ├── formatters.ts
│   │   └── dataLoaders.ts
│   ├── data/
│   │   ├── segments.json
│   │   ├── models.json
│   │   ├── metrics.json
│   │   ├── customers_summary.json
│   │   ├── risk_distribution.json
│   │   └── feature_importance.json
│   ├── context/
│   │   └── AppContext.tsx
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── generate_demo_data.py
├── docs/
│   ├── architecture.md (this file)
│   ├── technical_spec.md
│   ├── design_system.md
│   ├── component_hierarchy.md
│   ├── data_generation.md
│   └── DEMO_SCRIPT.md
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── amplify.yml
├── intake.yaml
└── README.md
```

---

## Conclusion

The ChurnIQ architecture is designed for:
- **Simplicity:** JAMstack pattern, no backend complexity
- **Performance:** CDN delivery, optimized bundles, fast charts
- **Maintainability:** TypeScript, component architecture, clear separation
- **Extensibility:** Easy to add tabs, charts, or scenarios
- **Executive UX:** Professional design, clear insights, interactive scenarios

The architecture balances demo-quality requirements (static data, no auth) with production-quality execution (performance, accessibility, design system compliance).

**Next Phase:** Development (Implement React application per this architecture)
