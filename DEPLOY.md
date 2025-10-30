# Deployment Guide: ChurnIQ Intelligence Platform

This guide covers deployment to AWS Amplify for the existing app at `d1p7obkrs6acpc.amplifyapp.com`.

## Quick Deploy

### Prerequisites
- AWS CLI installed and configured
- Access to AWS account with Amplify permissions
- Production build completed (`npm run build`)

### One-Command Deploy
```bash
./deploy-to-amplify.sh
```

This script will:
1. Locate the existing Amplify app by domain
2. Verify the `main` branch exists
3. Upload the production bundle
4. Wait for deployment to complete
5. Output the live URL

---

## Manual Deployment Options

### Option 1: AWS Amplify Console (Easiest)

1. **Open Amplify Console:**
   ```
   https://console.aws.amazon.com/amplify/home
   ```

2. **Select your app:** Look for the app with domain `d1p7obkrs6acpc.amplifyapp.com`

3. **Deploy manually:**
   - Click on the `main` branch
   - Click "Deploy without Git provider"
   - Upload: `artifacts/releases/churniq_amplify_20251028_151145.zip`
   - Click "Save and deploy"

4. **Monitor deployment:**
   - Watch the build progress in the console
   - Deployment typically takes 2-3 minutes

5. **Access your app:**
   ```
   https://main.d1p7obkrs6acpc.amplifyapp.com
   ```

### Option 2: AWS CLI Commands

```bash
# Set variables
export AWS_REGION=us-east-1
DOMAIN="d1p7obkrs6acpc.amplifyapp.com"
BRANCH="main"
BUNDLE="artifacts/releases/churniq_amplify_20251028_151145.zip"

# Find app ID
APP_ID=$(aws amplify list-apps \
  --query "apps[?defaultDomain=='${DOMAIN}'].[appId]" \
  --output text)

echo "App ID: $APP_ID"

# Create deployment
DEPLOY=$(aws amplify create-deployment \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH")

UPLOAD_URL=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin)['zipUploadUrl'])")
JOB_ID=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")

# Upload bundle
curl -X PUT -T "$BUNDLE" "$UPLOAD_URL" \
  -H "Content-Type: application/zip"

# Start deployment
aws amplify start-deployment \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --job-id "$JOB_ID"

# Monitor status
aws amplify get-job \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --job-id "$JOB_ID" \
  --query 'job.summary.status' \
  --output text
```

### Option 3: GitHub Integration (If Connected)

If the Amplify app is connected to a GitHub repo:

```bash
# Push to main branch
git checkout main
git merge your-feature-branch
git push origin main

# Amplify will auto-deploy from main
```

---

## Deployment Bundle

### Current Bundle
```
File: artifacts/releases/churniq_amplify_20251028_151145.zip
Size: 655 KB
Contents: Production build (dist/)
```

### Bundle Contents
```
dist/
├── index.html (entry point)
├── assets/
│   ├── index-[hash].css (27 KB)
│   ├── index-[hash].js (366 KB)
│   ├── react-vendor-[hash].js (44 KB)
│   └── d3-vendor-[hash].js (69 KB)
└── data/ (JSON files for demo)
```

### Verify Bundle
```bash
unzip -l artifacts/releases/churniq_amplify_20251028_151145.zip | head -20
```

---

## Amplify Configuration

### App Details
- **Domain:** d1p7obkrs6acpc.amplifyapp.com
- **Branch:** main
- **Region:** us-east-1
- **Build:** Static SPA (no backend)

### Environment Variables
None required (all configuration is client-side)

### Build Settings (if using GitHub)
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

## Authentication

**Important:** This deployment does **NOT** modify Basic Auth settings.

### Existing Credentials
- Username: (unchanged from Amplify branch settings)
- Password: (unchanged from Amplify branch settings)

### To Update Auth (Optional)
```bash
aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name main \
  --enable-basic-auth \
  --basic-auth-credentials "username:password" \
  --enable-auto-build
```

---

## Verification

### 1. Check Deployment Status
```bash
# Get latest job status
aws amplify list-jobs \
  --app-id "$APP_ID" \
  --branch-name main \
  --max-results 1
```

### 2. Test Live URL
```bash
# Check if site is accessible
curl -I https://main.d1p7obkrs6acpc.amplifyapp.com

# Expected response:
# HTTP/2 200
# content-type: text/html
```

### 3. Verify Features
Open in browser: `https://main.d1p7obkrs6acpc.amplifyapp.com`

**Check:**
- ✅ Dashboard loads with KPIs
- ✅ Agent provenance chips visible
- ✅ Scenarios tab: agent traces execute on slider changes
- ✅ AI Intelligence tab: Strategy Copilot responds to questions
- ✅ Analytics tab: charts render correctly
- ✅ Segments tab: heatmap is interactive

---

## Troubleshooting

### Deployment Fails

**Check build logs:**
```bash
aws amplify get-job \
  --app-id "$APP_ID" \
  --branch-name main \
  --job-id "$JOB_ID"
```

**Common issues:**
- **403 Forbidden:** Check AWS permissions
- **Bundle too large:** Amplify has a 200 MB limit (our bundle is 655 KB)
- **Build timeout:** Increase in Amplify console settings

### Site Not Loading

**Check CloudFront cache:**
```bash
# Invalidate cache if needed
aws amplify list-artifacts \
  --app-id "$APP_ID" \
  --branch-name main
```

**Clear browser cache:**
- Chrome: Cmd/Ctrl + Shift + R
- Safari: Cmd + Option + R

### Basic Auth Issues

**Verify auth is enabled:**
```bash
aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name main \
  --query 'branch.enableBasicAuth' \
  --output text
```

---

## Rollback

### To Previous Deployment
```bash
# List recent deployments
aws amplify list-jobs \
  --app-id "$APP_ID" \
  --branch-name main \
  --max-results 5

# Redeploy specific job
aws amplify start-job \
  --app-id "$APP_ID" \
  --branch-name main \
  --job-type RELEASE \
  --job-id "previous-job-id"
```

### To Snapshot
```bash
# Use the immutable snapshot
git checkout v2025.10.28-ai-demo-stable
npm run build
./deploy-to-amplify.sh
```

---

## Next Steps

After successful deployment:

1. **Test all features** (see Verification section)
2. **Share the URL** with stakeholders
3. **Monitor usage** in Amplify Console
4. **Set up custom domain** (optional)
5. **Configure CDN caching** for optimal performance

---

## Support

- **AWS Amplify Docs:** https://docs.aws.amazon.com/amplify/
- **Amplify Console:** https://console.aws.amazon.com/amplify/home
- **ChurnIQ Snapshot:** `v2025.10.28-ai-demo-stable`
- **Restore Script:** `./scripts/restore-stable.sh v2025.10.28-ai-demo-stable`
