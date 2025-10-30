#!/usr/bin/env bash
# Deploy ChurnIQ Churn Demo to AWS Amplify
# Usage: ./deploy-to-amplify.sh

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
AMPLIFY_DOMAIN="d1p7obkrs6acpc.amplifyapp.com"
BRANCH="main"
export AWS_REGION

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run:"
    echo "   aws configure"
    exit 1
fi

# Find the deployment bundle
BUNDLE=$(ls -t artifacts/releases/*.zip | head -1)
if [ -z "$BUNDLE" ]; then
    echo "❌ No deployment bundle found in artifacts/releases/"
    exit 1
fi

echo "🚀 Deploying to AWS Amplify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain: ${AMPLIFY_DOMAIN}"
echo "Branch: ${BRANCH}"
echo "Bundle: ${BUNDLE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# --- 1) Discover existing Amplify app by default domain ---
echo "🔎 Step 1/5: Locating Amplify app..."
APP_JSON="$(aws amplify list-apps --query "apps[?defaultDomain=='${AMPLIFY_DOMAIN}']|[0]" --output json)"
if [ "${APP_JSON}" = "null" ] || [ -z "${APP_JSON}" ]; then
  echo "❌ Could not find Amplify app with domain: ${AMPLIFY_DOMAIN}"
  echo "   Available apps:"
  aws amplify list-apps --query 'apps[].[name,defaultDomain]' --output table
  exit 1
fi

APP_ID="$(echo "$APP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['appId'])")"
APP_NAME="$(echo "$APP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")"
echo "✅ Found: ${APP_NAME} (${APP_ID})"
echo ""

# --- 2) Ensure target branch exists ---
echo "🔧 Step 2/5: Verifying branch '${BRANCH}'..."
BR_STATUS="$(aws amplify get-branch --app-id "${APP_ID}" --branch-name "${BRANCH}" --query 'branch.branchName' --output text 2>/dev/null || echo '')"
if [ "${BR_STATUS}" = "None" ] || [ -z "${BR_STATUS}" ]; then
  echo "❌ Branch '${BRANCH}' does not exist on this app."
  echo "   Available branches:"
  aws amplify list-branches --app-id "${APP_ID}" --query 'branches[].[branchName,displayName]' --output table
  exit 1
fi
echo "✅ Branch '${BRANCH}' exists"
echo ""

# --- 3) Check if repo-connected or manual deployment ---
echo "📡 Step 3/5: Checking deployment mode..."
SRC_REPO_URL="$(aws amplify get-app --app-id "${APP_ID}" --query 'app.repository' --output text 2>/dev/null || echo '')"
if [ -n "${SRC_REPO_URL}" ] && [ "${SRC_REPO_URL}" != "None" ]; then
  echo "🔁 App is connected to: ${SRC_REPO_URL}"
  echo "⚠️  This will trigger a build from the GitHub repo."
  echo "   Press Ctrl+C to cancel, or wait 5 seconds to continue..."
  sleep 5

  echo "▶️  Step 4/5: Triggering RELEASE job..."
  JOB_ID="$(aws amplify start-job --app-id "${APP_ID}" --branch-name "${BRANCH}" --job-type RELEASE --query 'jobSummary.jobId' --output text)"
  echo "   Job ID: ${JOB_ID}"

  echo "⏳ Step 5/5: Waiting for deployment..."
  for i in {1..60}; do
    STATUS="$(aws amplify get-job --app-id "${APP_ID}" --branch-name "${BRANCH}" --job-id "${JOB_ID}" --query 'job.summary.status' --output text)"
    echo "   [${i}/60] Status: ${STATUS}"
    case "$STATUS" in
      SUCCEED)
        DEPLOY_MODE="github_ci"
        break
        ;;
      FAILED|CANCELLED)
        echo "❌ Deployment ${STATUS}"
        aws amplify get-job --app-id "${APP_ID}" --branch-name "${BRANCH}" --job-id "${JOB_ID}"
        exit 1
        ;;
      *) sleep 5 ;;
    esac
  done
else
  echo "📦 Manual ZIP deployment mode"

  echo "▶️  Step 4/5: Creating deployment..."
  DEPLOY_JSON="$(aws amplify create-deployment --app-id "${APP_ID}" --branch-name "${BRANCH}")"
  UPLOAD_URL="$(echo "$DEPLOY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['zipUploadUrl'])")"
  JOB_ID="$(echo "$DEPLOY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")"

  echo "⬆️  Uploading ${BUNDLE}..."
  curl -sS -X PUT -T "${BUNDLE}" "${UPLOAD_URL}" -H "Content-Type: application/zip"

  echo "▶️  Starting deployment job..."
  aws amplify start-deployment --app-id "${APP_ID}" --branch-name "${BRANCH}" --job-id "${JOB_ID}" >/dev/null

  echo "⏳ Step 5/5: Waiting for deployment..."
  for i in {1..60}; do
    STATUS="$(aws amplify get-job --app-id "${APP_ID}" --branch-name "${BRANCH}" --job-id "${JOB_ID}" --query 'job.summary.status' --output text)"
    echo "   [${i}/60] Status: ${STATUS}"
    case "$STATUS" in
      SUCCEED)
        DEPLOY_MODE="manual_zip"
        break
        ;;
      FAILED|CANCELLED)
        echo "❌ Deployment ${STATUS}"
        aws amplify get-job --app-id "${APP_ID}" --branch-name "${BRANCH}" --job-id "${JOB_ID}"
        exit 1
        ;;
      *) sleep 5 ;;
    esac
  done
fi

# --- 4) Output summary ---
APP_URL="https://${BRANCH}.${AMPLIFY_DOMAIN}"
mkdir -p artifacts
cat > artifacts/deploy_summary.json <<JSON
{
  "appId": "${APP_ID}",
  "appName": "${APP_NAME}",
  "branch": "${BRANCH}",
  "url": "${APP_URL}",
  "bundle": "${BUNDLE}",
  "mode": "${DEPLOY_MODE}",
  "region": "${AWS_REGION}",
  "jobId": "${JOB_ID}",
  "timestamp": "$(date -u +%FT%TZ)"
}
JSON

echo ""
echo "✅ ════════════════════════════════════════════════════════════"
echo "✅  DEPLOYMENT SUCCESSFUL"
echo "✅ ════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Live URL:     ${APP_URL}"
echo "🆔 App ID:       ${APP_ID}"
echo "🏷️  Branch:       ${BRANCH}"
echo "📦 Bundle:       ${BUNDLE}"
echo "🔧 Deploy Mode:  ${DEPLOY_MODE}"
echo "📋 Summary:      artifacts/deploy_summary.json"
echo ""
echo "🔒 Note: Basic Auth credentials remain unchanged"
echo ""
echo "🧪 Test the deployment:"
echo "   curl -I ${APP_URL}"
echo ""
