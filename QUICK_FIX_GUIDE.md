# QUICK FIX GUIDE - P0 Critical Failures

**Problem:** 5 queries fail due to missing filter parameters in `get_segment_analysis()` tool

**Impact:** Users cannot filter segments by risk level or value tier

**Fix Time:** ~2 hours

---

## WHAT TO FIX

### File: `/Users/pfay01/Projects/televantage-churn-demo/src/ai/tools.ts`

**3 changes needed:**
1. Update function signature (line 147)
2. Add filter logic (after line 178)
3. Update toolSpecs description (line 303)

---

## STEP 1: Update Function Signature

**Find this (line 147):**
```typescript
get_segment_analysis({ contract_type, tenure_band }: { contract_type?: string; tenure_band?: string } = {}): ToolResult {
```

**Replace with:**
```typescript
get_segment_analysis({
  contract_type,
  tenure_band,
  risk_level,
  value_tier
}: {
  contract_type?: string;
  tenure_band?: string;
  risk_level?: string;
  value_tier?: string;
} = {}): ToolResult {
```

---

## STEP 2: Add Filter Logic

**Find this section (after line 178):**
```typescript
  segments = segments.filter((s:any) => s.tenure_band === targetTenure);
}

if (segments.length === 0) {
```

**Add BEFORE "if (segments.length === 0)":**
```typescript
// Filter by risk_level if specified
if (risk_level) {
  const normalized = risk_level.toLowerCase();
  if (normalized.includes('low') && !normalized.includes('very')) {
    segments = segments.filter((s:any) => s.risk_level === 'Low');
  } else if (normalized.includes('medium') || normalized.includes('med')) {
    segments = segments.filter((s:any) => s.risk_level === 'Medium');
  } else if (normalized.includes('high') && !normalized.includes('very')) {
    segments = segments.filter((s:any) => s.risk_level === 'High');
  } else if (normalized.includes('very high')) {
    segments = segments.filter((s:any) => s.risk_level === 'Very High');
  }
}

// Filter by value_tier if specified
if (value_tier) {
  const normalized = value_tier.toLowerCase();
  if (normalized.includes('low')) {
    segments = segments.filter((s:any) => s.value_tier === 'Low');
  } else if (normalized.includes('med') || normalized.includes('medium')) {
    segments = segments.filter((s:any) => s.value_tier === 'Med');
  } else if (normalized.includes('high')) {
    segments = segments.filter((s:any) => s.value_tier === 'High');
  }
}
```

---

## STEP 3: Update Tool Description

**Find this (line 303):**
```typescript
{ name:"get_segment_analysis", description:"Analyze customer segments by contract type (month-to-month, annual) and/or tenure band", parameters:{ type:"object", properties:{ contract_type:{ type:"string", description:"Contract type filter: 'month-to-month', 'MTM', 'annual', 'yearly'" }, tenure_band:{ type:"string", description:"Tenure band filter: '0-3 Months', '4-12 Months', etc." } } } },
```

**Replace with:**
```typescript
{
  name:"get_segment_analysis",
  description:"Analyze customer segments by contract type (month-to-month, annual), tenure band, risk level (Low/Medium/High/Very High), and/or value tier (Low/Med/High)",
  parameters:{
    type:"object",
    properties:{
      contract_type:{
        type:"string",
        description:"Contract type filter: 'month-to-month', 'MTM', 'M2M', 'annual', '1yr', '2yr'"
      },
      tenure_band:{
        type:"string",
        description:"Tenure band filter. Examples: 'early-tenure', 'new customers', '0-3 months', 'first 3 months', '4-12 months', 'young customers', '13-24 months', 'mid-tenure', '25-48 months', 'mature', '49-72 months', 'long-term'. Tool will normalize these to data format."
      },
      risk_level:{
        type:"string",
        description:"Risk level filter. Examples: 'Low', 'Medium', 'High', 'Very High', 'high-risk customers', 'low-risk'. Case-insensitive."
      },
      value_tier:{
        type:"string",
        description:"Value tier filter. Examples: 'Low', 'Med', 'Medium', 'High', 'low-value', 'high-value customers'. Case-insensitive."
      }
    }
  }
},
```

---

## TESTING AFTER FIX

Run these queries in the Strategy Copilot:

### Query 1: "Tell me about high-risk customers"
**Expected Result:**
- Should return only segments where risk_level = "High" or "Very High"
- Chart should show high-risk customer distribution
- Table should show only high-risk segments

### Query 2: "What about early-tenure customers?"
**Expected Result:**
- Should return only segments where tenure_band = "0-3m"
- Chart should show early tenure (0-3m) distribution by contract type
- Table should list M2M, 1yr, 2yr segments for 0-3m tenure

### Query 3: "What about high-value customers?"
**Expected Result:**
- Should return only segments where value_tier = "High"
- Chart should show high-value customer distribution
- Table should show only High value tier segments

### Query 4: "Tell me about low-value month-to-month customers"
**Expected Result:**
- Should return segments where contract_group = "M2M" AND value_tier = "Low"
- Chart should show only low-value M2M segments by tenure
- Table should have tenure=0-3m/4-12m/etc, contract=M2M, value_tier=Low

### Query 5: "Show segments by value tier"
**Expected Result:**
- Should return all segments
- LLM should group/organize by value tier in response
- All three value tiers should be represented

---

## VERIFICATION CHECKLIST

After making changes:

- [ ] Code compiles without errors (`npm run build`)
- [ ] Test Query 1: "Tell me about high-risk customers" returns filtered results
- [ ] Test Query 2: "What about early-tenure customers?" returns 0-3m segments
- [ ] Test Query 3: "What about high-value customers?" returns High value tier only
- [ ] Test Query 4: Multi-filter works (M2M + Low value)
- [ ] Test Query 5: "Show segments by value tier" returns all segments
- [ ] Existing queries still work (don't break backward compatibility)
- [ ] Charts render correctly for filtered results
- [ ] Citations are present in responses

---

## ROLLBACK PLAN

If fix causes issues, revert these changes:

```bash
git checkout HEAD -- src/ai/tools.ts
```

Original function signature is backward compatible (all new params are optional).

---

## EXPECTED IMPACT

**Before Fix:**
- 22/34 queries working (65%)
- 5/34 queries failing (15%)
- 7/34 queries uncertain (20%)

**After Fix:**
- 29/34 queries working (85%+)
- 0/34 critical failures
- 5/34 queries uncertain (minor issues only)

**Success Criteria:**
- All 5 test queries above return correct filtered results
- No regression in existing working queries
- User can now ask about high-risk, high-value, and early-tenure segments

---

## NEED HELP?

**Common Issues:**

1. **"No segments found" error**
   - Check that filter logic matches data format exactly
   - segments.json uses: "Low", "Med", "High" (not "Medium")
   - segments.json uses: "Low", "Medium", "High", "Very High" for risk

2. **LLM not passing parameters**
   - Check that toolSpecs description includes examples
   - Verify parameter names match exactly
   - Test with explicit queries: "Show high-risk customers" should work better than "What about risky customers"

3. **Chart not showing filtered data**
   - Verify segments array is filtered before creating chart
   - Check that chartData uses filtered segments (line 233-236)

---

## ADDITIONAL CONTEXT

**Why these parameters were missing:**
- Original tool was designed for contract and tenure filtering only
- Risk and value tier dimensions were added to data later
- Tool was never updated to support new dimensions

**Why this fix is safe:**
- All new parameters are optional
- Filter logic mirrors existing contract_type and tenure_band patterns
- No changes to data structures or return format
- Backward compatible with existing queries

**Files affected:**
- `/Users/pfay01/Projects/televantage-churn-demo/src/ai/tools.ts` (only file)

**Files NOT affected:**
- segments.json (read-only, no changes)
- router.ts (no changes to routing logic)
- aiServiceV2.ts (no changes to service layer)
- UI components (no changes to display logic)
