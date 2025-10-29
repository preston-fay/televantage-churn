# Amplify SPA Routing Configuration

## Problem
Direct visits to routes like `/scenarios`, `/llm-check`, etc. return 404 because Amplify tries to find physical files at those paths.

## Solution: SPA Rewrite Rule

### Option 1: Using `public/_redirects` (Already Implemented ✅)
The file `public/_redirects` contains:
```
/*    /index.html   200
```

This should be copied to the build output automatically by Vite.

### Option 2: Amplify Console Rewrite (Backup Method)
If `_redirects` doesn't work, configure in Amplify Console:

1. Go to: **Amplify Console** → Your App → **App settings** → **Rewrites and redirects**
2. Click **Add rewrite and redirect**
3. Configure:
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
4. Click **Save**
5. Redeploy the app

### Alternative Simple Rule
If the regex above is too complex, use:
- **Source address**: `/<*>`
- **Target address**: `/index.html`
- **Type**: `200 (Rewrite)`

## How to Verify
After deploying:
1. Visit `https://main.d1p7obkrs6acpc.amplifyapp.com/scenarios` directly
2. Should load the app (no 404)
3. Check browser DevTools → Network tab
4. Should see `index.html` returned with 200 status

## Current Routes That Need This
- `/` (root - works by default)
- `/scenarios` (Scenario Planner)
- `/workflow` (AI Workflow)
- `/analytics` (Modeling Deep Dive)
- `/segments` (Segment Explorer)
- `/llm-check` (Production Diagnostics)

## Technical Details
- **Framework**: React with React Router (BrowserRouter)
- **Build Output**: `dist/` directory
- **Entry Point**: `dist/index.html`
- **Routing**: Client-side only (no SSR)
