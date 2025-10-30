# ChurnIQ Intelligence Platform - Intake Summary

**Status:** ✅ READY FOR REVIEW
**Date:** October 27, 2025
**Project Location:** `/Users/pfay01/Projects/churniq-demo`

---

## Project Overview

**What:** Executive demo application showcasing AI-powered churn prediction and retention strategy optimization for ChurnIQ, a fictional #7 US telecom carrier with 47.3M subscribers.

**Why:** Demonstrate Kearney's multi-agent AI orchestration capabilities and strategic insights derived from advanced churn modeling.

**Timeline:** 2 weeks (Planning → Development → QA → Documentation)

**Deployment:** AWS Amplify static hosting

---

## Key Specifications

### Business Context
- **Company:** ChurnIQ (#7 US carrier, 47.3M subscribers)
- **Annual Churn Cost:** $1.42B (baseline)
- **AI Savings Opportunity:** $312M (22% reduction)
- **Model Performance:** 85% AUC (Logistic Regression)
- **Data Source:** `/Users/pfay01/Projects/telco-churn_v2` (scaled 6,714x)

### Technical Stack
- **Frontend:** React 18 + TypeScript 5 + Vite 5
- **Styling:** Tailwind CSS 3 (Kearney dark theme)
- **Visualizations:** D3.js 7 (NO Chart.js/Recharts)
- **Routing:** React Router 6
- **Deployment:** AWS Amplify

### Design System
- **Background:** Pure black (#0A0A0A)
- **Accent:** Kearney purple (#7823DC) - sparingly for highlights
- **Text:** White (#FFFFFF) headings, Light gray (#E5E5E5) body
- **Font:** Inter (Google Fonts, modern UI font with superior readability)
- **Rules:** NO gridlines, NO emojis, label-first approach

---

## Application Structure

### 5 Tabs

**Tab 1: Executive Dashboard**
- 4 hero KPI cards (Customer Base, Churn Cost, AI Opportunity, AUC)
- Risk distribution donut chart
- Churn economics waterfall chart
- Top 3 strategic recommendations
- Quick insights callouts

**Tab 2: Scenario Planner (Interactive What-If)**
- Scenario A: Contract Conversion (M2M → Annual)
- Scenario B: Onboarding Excellence (Early churn reduction)
- Scenario C: Budget Optimization (ROI curve)
- Global economic assumptions panel (affects all scenarios)
- Real-time calculations with before/after visualizations

**Tab 3: Agentic AI Workflow**
- Static workflow diagram (Data → ML → Strategy → QA agents)
- Agent descriptions with inputs/outputs
- Kearney differentiation messaging
- Time/cost comparison (Traditional vs AI-enabled)

**Tab 4: Modeling & Analytics Deep-Dive**
- 4A: Model Zoo comparison (6 models, AUC/Brier/AP)
- 4B: Performance metrics (AUC explanation, calibration, confusion matrix)
- 4C: Feature importance (Top 10 drivers with business interpretations)
- 4D: Profit optimization (Profit curve, threshold rationale)

**Tab 5: Segment Explorer**
- Interactive heatmap (Tenure × Contract, color = churn prob, size = population)
- Click segment → modal with details (population, risk, strategy, ROI)
- 54 segments total (5 tenure × 3 contracts × 3 value tiers)

---

## D3.js Visualizations (7+ Charts)

1. **Donut Chart:** Risk distribution (Low/Med/High/Very High)
2. **Waterfall Chart:** Churn economics (Baseline → Savings → Residual)
3. **Grouped Bar Chart:** Model comparison (6 models by metrics)
4. **Line Chart:** Churn rate by tenure band
5. **ROI Curve:** Budget optimization with optimal point
6. **Calibration Plot:** Predicted vs actual churn (scatter + diagonal)
7. **Horizontal Bar Chart:** Feature importance (sorted, labeled)
8. **Heatmap:** Segment explorer (interactive, color gradient, sized bubbles)

**All charts:** NO gridlines, clean axes, Kearney dark theme

---

## Data Scaling

**Base:** 7,044 customers (telco-churn_v2)
**Target:** 47.3M customers (scale factor: 6,714x)

**Methodology:**
1. Load telco-churn_v2 results
2. Multiply customer counts by 6,714
3. Maintain distributions (churn rate, segment sizes, risk levels)
4. Scale financial metrics (ARPU $65, LTV 36mo, Margin 45%)
5. Aggregate to segment level (54 segments)
6. Generate static JSON files

**Source Files:**
- `artifacts/model_leaderboard.csv`
- `artifacts/complete_metrics.json`
- `artifacts/segment_optimal_thresholds.csv`
- `results/scored_FIXED.csv`
- `docs/qa_report.md`
- `docs/test_results.md`

---

## Acceptance Criteria

✓ All 5 tabs functional and visually polished
✓ All 7+ D3.js charts render with dark theme
✓ All 3 scenario simulators calculate in real-time
✓ Segment explorer heatmap is interactive
✓ Global economic assumptions affect all scenarios
✓ Deploys successfully to AWS Amplify
✓ Lighthouse score: Performance >90, Accessibility >95
✓ NO TypeScript errors in production build
✓ Data properly scaled from telco-churn_v2 (6,714x)
✓ Demo script with timing and talking points
✓ Design matches Kearney brand
✓ NO gridlines on any charts
✓ NO emojis in UI
✓ Text is readable (white/gray, NOT purple on black)

---

## Deliverables

**Implementation:**
- Complete React application with 5 tabs
- 7+ D3.js visualizations
- 3 interactive scenario simulators
- Static JSON data files
- Tailwind config with Kearney theme
- Reusable components (KPI Card, Chart Container, Modal, Slider, Input)

**Deployment:**
- AWS Amplify configuration (amplify.yml)
- Build optimization (code splitting, lazy loading)
- Environment variables configuration

**Documentation:**
- README.md (local dev, build, deployment)
- DEMO_SCRIPT.md (talking points, timing, Q&A)
- DESIGN_SYSTEM.md (colors, typography, components)
- DATA_GENERATION.md (scaling methodology)
- ARCHITECTURE.md (technical decisions, trade-offs)

**Demo Materials:**
- Executive summary (1-pager)
- Demo script with timing (15-minute walkthrough)
- FAQ document (common questions + answers)
- Screenshot gallery (all 5 tabs)

---

## Key Constraints

- **Timeline:** 2 weeks end-to-end
- **No live model inference** (pre-calculated results only)
- **Static data** (no database, no authentication)
- **Desktop-first** (optimized for 1920×1080 presentations)
- **Demo quality** (production-ready UI, simplified backend)
- **NO pie charts** (donut charts acceptable)
- **NO gridlines** on any visualizations
- **NO emojis** in UI
- **MUST use Arial font** (web-safe)
- **Text must be white/gray** (NOT purple on black)
- **Kearney purple ONLY for accents** (buttons, highlights, CTAs)

---

## Performance Targets

- Initial page load: <3 seconds
- Tab switch: <300ms
- Chart render: <1 second
- Scenario recalculation: <100ms
- Lighthouse score: Performance >90, Accessibility >95
- Build time: <30 seconds
- Bundle size: <500KB gzipped

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| D3.js learning curve | Use examples, start simple, iterate |
| Scaling data may produce unrealistic distributions | Validate scaled distributions match original percentages |
| Dark theme readability issues | Use white/gray text, purple only for accents |
| Scenario calculations too slow | Pre-calculate common scenarios, optimize JS |
| AWS Amplify deployment issues | Use proven amplify.yml pattern, test early |
| 2-week timeline aggressive | Use orchestrator workflow, MVP first, polish later |

---

## Next Steps

1. **Review intake.yaml** - Validate specifications with stakeholders
2. **Start orchestrator workflow:** `cd ~/Projects/churniq-demo && orchestrator run start --intake intake.yaml`
3. **Planning Phase:** Architect agent designs system architecture
4. **Development Phase:** Developer agent implements 5 tabs + 7 charts
5. **QA Phase:** QA agent validates functionality and design
6. **Documentation Phase:** Documentarian creates demo script and guides

---

## Files Created

- ✅ `intake.yaml` - Comprehensive project specifications (343 lines)
- ✅ `INTAKE_SUMMARY.md` - This document (executive overview)
- ✅ `.claude/` - Orchestrator configuration files
- ✅ `.git/` - Git repository initialized

**Project is ready to begin orchestrator workflow!**

---

**To start the workflow:**

```bash
cd ~/Projects/churniq-demo
orchestrator run start --intake intake.yaml
```

This will invoke the Architect agent to begin the Planning Phase.
