# Demo Snapshot Artifacts

This directory contains immutable snapshots of the ChurnIQ Intelligence Platform at stable milestones.

## Current Snapshot

**Date:** 2025-10-28
**Tag:** `v2025.10.28-ai-demo-stable`
**Branch:** `demo-freeze-2025-10-28`
**Features:**
- ✅ Agent execution traces on all scenarios
- ✅ Agent provenance on all KPIs and charts
- ✅ Strategy Copilot with conversational Q&A
- ✅ 54 customer segments with detailed analysis
- ✅ 3 interactive ROI scenarios

## Restore Snapshot Locally

### Quick Restore (using script)
```bash
./scripts/restore-stable.sh v2025.10.28-ai-demo-stable
```

### Manual Restore
```bash
# Checkout the tagged snapshot
git checkout v2025.10.28-ai-demo-stable

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Deploy Offline Bundle

The `releases/` directory contains pre-built production bundles:

```bash
# Extract the bundle
unzip releases/AI_DEMO_2025_10_28.zip -d /path/to/deploy

# Serve with any static file server
cd /path/to/deploy
python3 -m http.server 8080
# or
npx serve .
```

## Snapshot Contents

- **freeze_summary.json** - Metadata about the snapshot (commit SHA, branch, tag, etc.)
- **releases/AI_DEMO_2025_10_28.zip** - Production build (655KB)
- **../scripts/restore-stable.sh** - Automated restore script

## Why Snapshots?

Snapshots allow you to:
1. **Safely iterate** - Try new features without fear of breaking the working demo
2. **Instant rollback** - Restore the exact working state in seconds
3. **Offline deployment** - Deploy pre-built bundles without rebuilding
4. **Version history** - Track stable milestones over time

## Creating New Snapshots

Run the freeze script with updated date:
```bash
GITHUB_OWNER=preston-fay REPO_NAME=televantage-churn ./scripts/freeze-demo.sh
```

## Notes

- The snapshot branch (`demo-freeze-2025-10-28`) and tag (`v2025.10.28-ai-demo-stable`) exist **locally only**
- Push restrictions prevent automatic remote upload of non-session branches
- To push manually (after confirming with repo owner):
  ```bash
  git push origin demo-freeze-2025-10-28
  git push origin v2025.10.28-ai-demo-stable
  ```
- The offline bundle can be deployed to any static hosting (S3, Netlify, Vercel, etc.)
