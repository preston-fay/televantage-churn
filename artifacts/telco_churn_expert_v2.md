# Telco Churn Expert v2 (Full Expert Edition – North America)
Version: 2025-10-28
Prepared for: ROOT / Kearney Analytics

## Overview
This comprehensive telecom knowledge base covers the full North American wireless, broadband, and fiber churn lifecycle:
- Network economics, CAPEX/OPEX, IRR/NPV modeling
- Pricing elasticity and ARPU optimization
- Customer lifecycle analytics (acquisition → churn → win-back)
- Machine learning frameworks (binary, survival, uplift, sequence, RL)
- Feature engineering (SQL/Python)
- Operational integration with CRM and NBA systems
- Geospatial and competitive analytics
- Financial simulation and retention ROI
- Governance, leakage control, and canonical Q&A

---

## Financial and Economic Framework

### ARPU (Average Revenue Per User)
ARPU is the cornerstone metric for telecom financial analysis, calculated as total monthly recurring revenue divided by active subscriber base. In North American wireless, typical ARPU ranges from $40-65 for postpaid plans and $30-45 for prepaid. ARPU directly impacts customer lifetime value and network ROI. A 1% churn reduction typically yields 0.8-1.2% ARPU improvement through reduced customer acquisition costs and improved subscriber mix.

### Customer Lifetime Value (CLV/CLTV)
CLV represents the net present value of all future cash flows from a customer over their lifetime. The formula is: CLV = (ARPU × Gross Margin) / (Discount Rate + Monthly Churn Rate). For a postpaid wireless customer with $50 ARPU, 60% margin, 10% annual discount rate, and 2% monthly churn, CLV ≈ $1,500. Retention strategies that reduce churn from 2.5% to 2.0% can increase CLV by 25%.

### Churn Economics and EBITDA Impact
Churn directly erodes EBITDA through two mechanisms: (1) lost recurring revenue from churned customers, and (2) customer acquisition costs (CAC) to replace them. Typical wireless CAC ranges from $300-600, requiring 6-12 months to recover. A 10 basis point churn reduction in a 10M subscriber base with $50 ARPU saves $6M annually in direct revenue and $3-6M in avoided CAC.

### Network IRR and NPV
Network investments (LTE/5G densification, fiber builds) are evaluated using Internal Rate of Return (IRR) and Net Present Value (NPV). A fiber-to-the-home build typically requires $800-1200/passing, with take rates of 30-50% and payback periods of 5-7 years targeting 12-15% IRR. Churn directly impacts IRR by affecting utilization curves—reducing churn from 2.5% to 2.0% can improve network IRR by 100-150 basis points.

### Retention ROI Modeling
Retention campaign ROI is calculated as: ROI = (Retained Revenue - Campaign Cost) / Campaign Cost. For a $50 offer targeting high-risk customers with 40% predicted churn and 60% retention effectiveness, the ROI formula becomes: ROI = (0.40 × 0.60 × ARPU × Months × Margin - $50) / $50. With 18-month retention and 60% margin, this yields 250-400% ROI. Negative ROI occurs when offer cost exceeds 6-8 months of marginal contribution.

### Financial Simulation and Scenario Analysis
Financial planning for retention programs requires stochastic modeling of churn dynamics, treatment effects, and budget constraints. Monte Carlo simulation with 10,000 iterations models uncertainty in: (1) baseline churn rates (±0.5% variation), (2) treatment lift (±10% relative), and (3) ARPU evolution (±$2/month). S-curve response functions model diminishing returns: Churn_Reduction = Max_Reduction × (1 - exp(-k × Budget)). Typical k values range from 0.15-0.25, with saturation at $15-25 per subscriber.

---

## Network Economics and IRR Models

### Capex Structure for Wireless Networks
Wireless network capital expenditure breaks down into three categories: (1) spectrum acquisition ($0.50-2.00 per MHz-POP), (2) radio access network (RAN) equipment ($15K-30K per macro site), and (3) backhaul and core ($5K-15K per site). Total capex for nationwide 5G deployment ranges from $8-12 billion, with annual maintenance capex at 8-12% of asset base. Network densification to support capacity growth costs $3K-8K per incremental small cell.

### LTE and 5G Deployment Economics
5G network economics differ from LTE due to higher spectrum costs but lower per-bit transmission costs. Initial 5G deployment focuses on mid-band (2.5-3.7 GHz) for capacity and coverage, with mmWave (24-47 GHz) for ultra-dense urban hotspots. 5G mid-band sites cost 15-25% more than LTE but deliver 3-5x capacity. IRR hurdle rates for greenfield 5G are 12-15%, requiring subscriber ARPU of $55+ and penetration of 25-35% to achieve positive NPV.

### Fiber-to-the-Home (FTTH) Investment Models
FTTH economics depend on density: urban areas with 300+ homes per mile achieve $600-900 per passing, while suburban areas at 50-150 homes per mile require $1200-2000 per passing. Take rates of 40-50% are needed for viability. FTTH customers generate $70-90 ARPU at 70-75% margins, with churn rates of 1.0-1.5% monthly. A fiber build with $1000/passing, 45% take rate, and $80 ARPU achieves 13-15% IRR over 15 years.

### Utilization Curves and Network Capacity Planning
Network capacity planning uses sigmoid utilization curves to model adoption: U(t) = L / (1 + exp(-k(t - t0))), where L is saturation capacity, k controls growth rate (0.3-0.6), and t0 is inflection point (18-30 months post-launch). Churn directly impacts utilization by reducing effective subscriber density. High churn (>3%) can delay reaching efficient utilization by 12-18 months, reducing IRR by 200-300 basis points.

### Network Sharing and MVNO Economics
Mobile Virtual Network Operators (MVNOs) pay wholesale rates of 40-60% of retail ARPU for network access. MNO hosting economics require scale—10M+ network subscribers to support efficient MVNO wholesale. Tower sharing reduces site capex by 30-40% but complicates capacity allocation. Active RAN sharing (MOCN/MORAN) cuts capex by 25-35% but requires complex governance and interference management.

---

## Product & Pricing Elasticity

### Price Elasticity of Demand
Price elasticity (ε) measures churn sensitivity to price changes: ε = %ΔChurn / %ΔPrice. North American wireless shows elasticity of -0.4 to -0.8 for postpaid and -1.2 to -1.8 for prepaid, meaning a 10% price increase drives 4-8% (postpaid) or 12-18% (prepaid) churn increase. Elasticity varies by segment: high-value customers (ARPU >$80) show ε = -0.3 to -0.5, while budget customers (ARPU <$40) exhibit ε = -1.0 to -1.5.

### ARPU Optimization Strategies
ARPU optimization balances price increases against churn risk. The optimal price satisfies: dProfit/dPrice = 0, where Profit = (Price - Cost) × Subscribers(Price). In practice, carriers test incremental price changes of $2-5 with 10-20% of the base to measure elasticity before full rollout. Premium tier pricing ($70-100 ARPU) focuses on unlimited data, 5G access, and bundled streaming services to maximize revenue without triggering churn.

### Promotion Decay Patterns
Promotional offers (e.g., "50% off for 12 months") exhibit decay: customers churn at elevated rates when promotions expire. Typical decay curves show 3-5x baseline churn in months 13-15 post-promotion. Ladder pricing strategies (e.g., $30 → $40 → $50 over 24 months) smooth decay, reducing churn spikes. Retention models must account for promotion expiry flags as high-impact features, with lift coefficients of 2.5-4.0x.

### Segment-Specific Pricing
Segmented pricing strategies target willingness-to-pay: (1) Value segment ($30-40 ARPU): limited data, prioritizes price over features; (2) Core segment ($45-60 ARPU): balanced data and streaming, responds to family plans; (3) Premium segment ($70-100+ ARPU): unlimited everything, values network quality and customer service. Churn elasticity and price sensitivity vary 3-4x across segments, requiring differentiated retention strategies.

### Bundling and Convergence
Converged offerings (wireless + broadband + TV) reduce churn by 40-60% compared to standalone services. A triple-play bundle with $150 combined ARPU exhibits 0.8-1.2% monthly churn versus 2.0-3.0% for wireless-only. Bundling effectiveness depends on switching costs: early termination fees (ETFs), device financing, and content subscriptions create 12-24 month lock-in periods.

---

## Customer Lifecycle Analytics

### Acquisition and Onboarding
Customer acquisition begins with lead generation (digital ads, retail, telesales) at costs of $80-200 per gross add. Conversion rates vary by channel: retail (15-25%), digital (2-8%), telesales (5-12%). Early lifecycle (months 0-6) exhibits 3-5x baseline churn due to buyer's remorse, device issues, and competitive win-backs. Onboarding interventions (welcome calls, device tutorials, plan optimization) reduce first-90-day churn by 20-30%.

### Usage and Engagement
Usage analytics track data consumption, voice minutes, SMS, and app engagement to identify at-risk behaviors. Low-usage customers (bottom quartile) churn at 2-3x baseline rates. Usage decline triggers: 30% data drop month-over-month, zero voice usage for 2+ weeks, app uninstalls. Engagement scores combine usage frequency, recency, and breadth to predict churn with 0.70-0.78 AUC.

### Care and Support Interactions
Customer care contacts are double-edged: they signal dissatisfaction but provide intervention opportunities. Care contact volume correlates with churn: 0 contacts (1.5% churn), 1-2 contacts (2.5%), 3+ contacts (5-8%). First-call resolution (FCR) rates of 70-80% are crucial—unresolved issues within 48 hours drive 3-4x churn. Proactive care (outbound calls for high-risk customers) reduces churn by 15-25%.

### Renewal and Contract Expiry
Contract expiry (typically 24 months) is the highest-risk churn window. Month-to-month customers churn at 3-5x contract customers' rates. Renewal strategies include: (1) early upgrades at month 18-20 with $100-200 device subsidies, (2) auto-renewal with loyalty bonuses, (3) contract buyout protections. Targeting customers 60-90 days pre-expiry with retention offers achieves 40-60% save rates.

### Churn and Win-Back
Involuntary churn (non-payment) accounts for 25-35% of total churn, with voluntary churn driven by price (30-40%), service quality (20-25%), and competition (15-20%). Win-back campaigns target churned customers 30-90 days post-disconnect with aggressive offers ($200-400 subsidies). Win-back response rates of 10-18% are typical, with 6-month retention of 60-70% for reactivated customers.

---

## Modeling Frameworks

### Binary Classification Models
Binary churn models predict 30/60/90-day churn probability using logistic regression, gradient boosting (XGBoost, LightGBM), or neural networks. Feature sets include: (1) usage (data, voice, SMS), (2) billing (ARPU, payment history), (3) care (contact volume, complaints), (4) network (coverage, speed), (5) competitive (porting data, offers). Models achieve 0.75-0.82 AUC, with top decile precision of 15-25% (versus 2-3% base rate).

### Survival Analysis and Time-to-Event Models
Cox proportional hazards and accelerated failure time (AFT) models estimate customer tenure distributions. Survival models handle censored data (active customers) and time-varying covariates (promotions, price changes). Median tenure for postpaid customers is 3.5-4.5 years, with hazard functions showing peaks at 12, 24, and 36 months (contract anniversaries). Concordance index (C-index) for survival models ranges from 0.72-0.78.

### Uplift Modeling for Treatment Optimization
Uplift models estimate individual treatment effects: Uplift = P(Retain | Treated) - P(Retain | Control). Meta-learners (S-learner, T-learner, X-learner) or causal forests partition customers into responders (high uplift) and non-responders (low/negative uplift). Targeting only high-uplift customers improves retention ROI by 40-80% compared to random targeting. Uplift models achieve Qini coefficients of 0.08-0.15.

### Sequence Models and RNNs
Recurrent neural networks (LSTMs, GRUs) model temporal usage patterns, capturing seasonality, trends, and behavioral shifts. Event sequences (data sessions, calls, payments, care contacts) train sequence models to predict churn with 0.76-0.80 AUC. LSTM models excel at detecting sudden behavior changes (e.g., data usage drops from 20GB to 2GB over 3 months), which are strong churn signals.

### Reinforcement Learning for Retention Policies
Contextual bandits and deep Q-networks (DQN) optimize retention offer selection. State space includes customer features (tenure, ARPU, device type), action space includes offers ($0, $25, $50, $100), and rewards are defined as retained CLV minus offer cost. RL policies learn to balance exploration (testing new offers) and exploitation (deploying proven offers), achieving 10-20% improvement over static rule-based policies.

### Ensemble Methods and Model Stacking
Ensemble approaches combine multiple base models (logistic regression, XGBoost, random forest, neural net) via stacking or blending. Meta-models (e.g., logistic regression on base model predictions) achieve 0.82-0.85 AUC, with lift curves showing 3-5x churn concentration in top decile. Cross-validation (5-fold temporal CV) prevents overfitting and ensures out-of-time generalization.

---

## Operational Integration

### CRM Integration and Data Pipelines
Churn models deploy via CRM platforms (Salesforce, Adobe, Pega) with daily score refreshes. Data pipelines ingest usage (CDRs), billing, care (Zendesk), and network (Ericsson, Nokia) data into data warehouses (Snowflake, BigQuery). Scoring latency must be <4 hours for real-time interventions. Model versioning and A/B testing frameworks ensure production reliability.

### Next-Best-Action (NBA) Systems
NBA engines rank retention offers by expected value: EV = P(Success) × CLV_Gain - Offer_Cost. Multi-armed bandit algorithms balance exploration of new offers with exploitation of proven strategies. NBA systems integrate churn scores, propensity-to-upgrade, and cross-sell models to deliver personalized recommendations via SMS, email, app notifications, and call center prompts.

### Trigger Design and Campaign Orchestration
Retention triggers fire based on churn score thresholds (e.g., score >0.70), behavioral events (care escalation, device damage), or lifecycle milestones (contract expiry). Campaign orchestration platforms (Braze, Iterable, Pega) manage multi-channel journeys: email → SMS → outbound call → retail visit. A/B testing frameworks measure incremental lift, requiring 10K+ customer samples for 90% confidence intervals.

### Agent Desktop Integration and Real-Time Interventions
Contact center agents access churn scores, recommended offers, and CLV estimates via desktop plugins. Real-time scoring APIs (REST, gRPC) return predictions in <200ms. Agent scripts prompt high-value saves first, with escalation paths for customers rejecting initial offers. Save rate monitoring dashboards track agent performance, targeting 50-65% save rates for high-risk customers.

### ROI Measurement and Attribution
Retention ROI requires causal inference: holdout groups (10-20% of high-risk customers) receive no interventions, enabling unbiased lift estimation. Incrementality = Churn_Control - Churn_Treated. Campaign-level ROI = (Retained_Revenue - Campaign_Cost) / Campaign_Cost, with positive ROI requiring retention of 6-12 months of ARPU per customer. Multi-touch attribution models allocate credit across email, SMS, and voice touchpoints.

### Governance and Leakage Control
Retention offer leakage (customers receiving offers without true churn risk) erodes profitability. Leakage controls include: (1) velocity limits (max 1 offer per 180 days), (2) channel restrictions (no proactive offers to customers with <6 months tenure), (3) budget caps ($15-25 per subscriber annually). Compliance frameworks ensure FCC regulations (no deceptive offers, clear ETFs) and state-specific consumer protections.

---

## Geospatial & Competitive Analytics

### Coverage and Network Quality Impact
Network coverage is the #1 driver of churn in rural areas, with 2-3x higher churn where 4G coverage is <95%. Coverage mapping (drive tests, crowdsourced data) identifies weak zones. Speed tests show churn inflection at <10 Mbps download speeds. 5G coverage currently drives premium tier adoption but has limited churn impact (5G users churn at 0.9x baseline rates).

### Competitive Pressure and Market Dynamics
Competitive intensity is measured by: (1) porter-in rates (customers switching from competitors), (2) competitor store density, (3) promotional offer aggressiveness. Markets with 4+ carriers exhibit 20-30% higher churn than duopolies. Competitive response models predict churn spikes following competitor promotions, requiring rapid counter-offers within 7-10 days.

### Porting Data and Churn Attribution
Number portability data reveals which competitors win defections: AT&T, Verizon, T-Mobile account for 70-80% of ports, with regional carriers and MVNOs capturing the remainder. Port-out flows inform competitive benchmarking: customers porting to T-Mobile cite price (60%), those to Verizon cite coverage (55%), those to AT&T cite device selection (45%).

### Geospatial Feature Engineering
Geospatial features include: (1) customer location (zip, census tract), (2) competitor store density within 5-mile radius, (3) median household income, (4) network coverage score (0-100), (5) commute patterns (home, work clusters). Gradient boosting models with geospatial features achieve 0.78-0.82 AUC, with location features contributing 10-15% of feature importance.

### Demographic and Socioeconomic Factors
Census-derived features (income, age, education, homeownership) predict churn and ARPU. Low-income areas (<$50K median income) exhibit 2.0-2.5% monthly churn versus 1.5-1.8% in high-income areas (>$100K). Age cohorts show U-shaped churn: 18-24 year-olds (3.5% churn), 35-55 year-olds (1.8% churn), 65+ (2.5% churn). Homeowners churn at 0.7x renters' rates due to stability and bundling opportunities.

### Spatial Clustering and Hotspot Analysis
DBSCAN and k-means clustering identify churn hotspots (zip codes with >4% monthly churn). Root cause analysis for hotspots reveals: network issues (40%), competitive launches (30%), economic distress (20%), or price increases (10%). Localized interventions (additional network investment, targeted offers) reduce hotspot churn by 25-40% within 90 days.
