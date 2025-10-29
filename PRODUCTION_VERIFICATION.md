# Production Verification Guide - Telco RAG Corpus

**Commit**: `defcbb6`
**Deployed**: Main branch
**Date**: 2025-10-29

---

## Quick Verification Checklist

### 1. Metadata Endpoint (30 seconds)

```bash
curl https://main.d1p7obkrs6acpc.amplifyapp.com/rag/v2/metadata.json
```

**Expected Output**:
```json
{
  "version": "v2",
  "created": "2025-10-29T12:31:57.168Z",
  "model": "text-embedding-3-large",
  "chunk_count": 7,
  "section_count": 7,
  "total_tokens": 3295
}
```

**✅ Pass Criteria**:
- HTTP 200 status
- `chunk_count`: 7 (was 5)
- `section_count`: 7
- `total_tokens`: ~3295 (was 2243)

**❌ Fail**: If you get 404 or old values (chunk_count: 5), Amplify build didn't complete or failed.

---

### 2. Corpus File Size (15 seconds)

```bash
curl -I https://main.d1p7obkrs6acpc.amplifyapp.com/rag/v2/telco_corpus.json
```

**Expected**:
- HTTP 200
- `Content-Length`: ~479KB (was 341KB)

---

### 3. Diagnostics UI Tests (2 minutes)

Visit: https://main.d1p7obkrs6acpc.amplifyapp.com/#/llm-check-rag

**Test A**: "Define ARPU"
- **Expected Route**: RAG
- **Expected Citation**: `[finance]` ✅ (this was MISSING before fix)
- **Pass Criteria**: Answer includes "Average Revenue Per User" and citation shows `[finance]`

**Test B**: "Explain churn economics"
- **Expected Route**: RAG
- **Expected Citations**: `[finance]` and/or `[modeling]`
- **Pass Criteria**: Multi-paragraph answer with 1-2 citations

**Test C**: "How does network IRR work?"
- **Expected Route**: RAG
- **Expected Citation**: `[network-economics]`
- **Pass Criteria**: Answer discusses IRR/NPV with network context

**Test D**: "How does CRM integration work?" (NEW - was broken before)
- **Expected Route**: RAG
- **Expected Citation**: `[ops]` ✅ (this was MISSING before fix)
- **Pass Criteria**: Answer discusses CRM platforms, data pipelines

---

### 4. Copilot Smoke Tests (3 minutes)

Open: https://main.d1p7obkrs6acpc.amplifyapp.com/

Open DevTools Console (F12 → Console tab)

#### Test 1: Conceptual Query (RAG Route)

**Input**: "Tell me everything about the telco business"

**Expected Console Output**:
```
🎯 askCopilot called with: Tell me everything about the telco business
🎯 Route: RAG { query: "...", ragScore: 3, numericScore: 1 }
→ Routing to RAG (conceptual query)
✅ RAG Success: { query: "...", citations: 2-4 }
```

**Expected Answer**:
- Multi-paragraph response (3-5 paragraphs)
- Citations: `[finance]` `[operations]` or similar
- Covers: financial metrics, network economics, lifecycle, etc.

**✅ Pass**: Routed to RAG, got citations
**❌ Fail**: Routed to NUMERIC or got feature importance table

---

#### Test 2: Numeric Query (NUMERIC Route)

**Input**: "Compare IRR by strategy as a bar chart"

**Expected Console Output**:
```
🎯 askCopilot called with: Compare IRR by strategy as a bar chart
🎯 Route: NUMERIC { query: "...", ragScore: 0, numericScore: 3 }
→ Routing to NUMERIC tools (data query)
✅ Numeric Tool Success: { query: "...", tool: "get_roi_by_strategy" }
```

**Expected Answer**:
- Bar chart with labeled axes
- Chart must have:
  - `title`: "IRR by Strategy" or similar
  - `xLabel`: "Strategy" or similar
  - `yLabel`: "IRR (%)" or similar
- Data table below chart

**✅ Pass**: Routed to NUMERIC, chart has all labels
**❌ Fail**: Unlabeled chart or routed to RAG

---

#### Test 3: New Conceptual Keywords (Expanded Router)

Try these NEW queries (should route to RAG with the expanded keywords):

**A**: "Give me a benchmark for telco churn"
- Keyword: `benchmark` (NEW)
- Expected: RAG route, `[finance]` or `[lifecycle]` citation

**B**: "What's the playbook for retention?"
- Keyword: `playbook` (NEW)
- Expected: RAG route, `[ops]` citation

**C**: "Explain customer lifecycle stages"
- Keyword: `lifecycle` (NEW)
- Expected: RAG route, `[lifecycle]` citation

**D**: "How do you segment customers?"
- Keyword: `segmentation` (NEW)
- Expected: RAG route, `[lifecycle]` or `[geo]` citation

**✅ Pass**: All 4 route to RAG with citations
**❌ Fail**: Any route to NUMERIC or return "I need more specific..."

---

### 5. Section Coverage Validation (1 minute)

In Console, run this after any RAG query:

```javascript
fetch('/rag/v2/telco_corpus.json')
  .then(r => r.json())
  .then(data => {
    const sections = data.chunks.map(c => c.section_id).sort();
    console.log('Sections:', new Set(sections));
    console.log('Count:', sections.length);
  });
```

**Expected Output**:
```
Sections: Set(7) { 'finance', 'geo', 'lifecycle', 'modeling', 'network-economics', 'ops', 'pricing-elasticity' }
Count: 7
```

**✅ Pass**: All 7 sections present (especially `finance` and `ops`)
**❌ Fail**: Only 5 sections (old corpus still deployed)

---

## Troubleshooting

### Issue: Old corpus (5 chunks) still served

**Symptoms**:
- `chunk_count: 5` in metadata
- Missing `[finance]` or `[ops]` citations
- Only 2243 tokens

**Fix**:
1. Check Amplify Console for build status (commit `defcbb6`)
2. If build succeeded, check CloudFront cache invalidation
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Try incognito/private window

---

### Issue: RAG bypass warnings in console

**Symptoms**:
```
⚠️ RAG BYPASS DETECTED {
  query: "Explain churn",
  toolUsed: "get_feature_importance",
  shouldHaveUsed: "rag_search"
}
```

**Fix**:
- This means LLM chose wrong tool despite router scoring
- Option A: Increase RAG priority by adjusting router scores
- Option B: Add pre-filter to force RAG for high-scoring queries
- Option C: File issue with specific query patterns that bypass

---

### Issue: Unlabeled charts

**Symptoms**:
- Chart renders but no title/xLabel/yLabel

**Fix**:
- Check `src/ai/tools.ts` - ensure all chart objects have:
  ```typescript
  return {
    chart: {
      kind: "bar",
      title: "ROI by Strategy",
      xLabel: "Strategy",
      yLabel: "ROI (%)",
      series: [...]
    }
  };
  ```

---

### Issue: Network timeout on corpus load

**Symptoms**:
- Console error: "Failed to load corpus: 504"
- RAG queries fail

**Fix**:
- Corpus file too large (should be ~479KB, max 1MB recommended)
- Check CloudFront timeout settings (default: 30s)
- Consider splitting into multiple files if needed

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Metadata chunk_count | 7 | ⬜ Verify |
| All 7 sections present | Yes | ⬜ Verify |
| "Define ARPU" → [finance] | Yes | ⬜ Verify |
| "CRM integration" → [ops] | Yes | ⬜ Verify |
| Conceptual → RAG route | >95% | ⬜ Verify |
| Numeric → NUMERIC route | >95% | ⬜ Verify |
| New keywords work | 4/4 | ⬜ Verify |
| Charts have labels | 100% | ⬜ Verify |

---

## Verification Report Template

Copy this and fill in after testing:

```
## Production Verification Report
Date: _________
Commit: defcbb6
Tester: _________

### 1. Metadata Endpoint
- Status: [✅ PASS / ❌ FAIL]
- chunk_count: ___
- section_count: ___
- total_tokens: ___

### 2. Section Coverage
- [✅/❌] finance
- [✅/❌] network-economics
- [✅/❌] pricing-elasticity
- [✅/❌] lifecycle
- [✅/❌] modeling
- [✅/❌] ops
- [✅/❌] geo

### 3. Diagnostics Tests
- Test A (Define ARPU): [✅ PASS / ❌ FAIL]
  - Citation: _________
- Test B (Churn economics): [✅ PASS / ❌ FAIL]
  - Citations: _________
- Test C (Network IRR): [✅ PASS / ❌ FAIL]
  - Citation: _________
- Test D (CRM integration): [✅ PASS / ❌ FAIL]
  - Citation: _________

### 4. Copilot Routing
- "Tell me about telco business": [RAG / NUMERIC / OTHER]
  - Citations: _________
- "Compare IRR by strategy": [RAG / NUMERIC / OTHER]
  - Chart labels present: [YES / NO]

### 5. New Keywords
- "benchmark": [RAG / NUMERIC / OTHER]
- "playbook": [RAG / NUMERIC / OTHER]
- "lifecycle": [RAG / NUMERIC / OTHER]
- "segmentation": [RAG / NUMERIC / OTHER]

### Overall Status
[✅ ALL PASS / ⚠️ PARTIAL / ❌ FAIL]

### Issues Found
(List any issues with screenshots/console logs)

### Next Steps
(What needs to be fixed, if anything)
```

---

**Estimated Time**: 10 minutes total
**Priority**: HIGH - Verify before announcing to stakeholders
**Owner**: Product/Engineering team
