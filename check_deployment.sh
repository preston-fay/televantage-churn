#!/bin/bash
set -euo pipefail

AWS_REGION="us-east-1"
AMPLIFY_DOMAIN="d1p7obkrs6acpc.amplifyapp.com"
TARGET="main"
SOURCE="claude/session-011CUZi11CFxX1t5fSX9AWK3"
export AWS_REGION

# 1) Get app info
APP_JSON="$(aws amplify list-apps --query "apps[?defaultDomain=='${AMPLIFY_DOMAIN}']|[0]" --output json)"
APP_ID="$(echo "$APP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['appId'])")"
APP_NAME="$(echo "$APP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")"
REPO_URL="$(echo "$APP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('repository',''))")"

echo "✅ Amplify App: ${APP_NAME} (${APP_ID})"
echo "📦 Repository: ${REPO_URL}"
echo ""

# 2) List branches
echo "🔎 Branches configured in Amplify:"
aws amplify list-branches --app-id "${APP_ID}" --query "branches[*].{Branch:branchName,Stage:stage,AutoBuild:enableAutoBuild}" --output table
echo ""

# 3) Latest jobs on TARGET
echo "🔎 Latest jobs on TARGET branch (${TARGET}):"
aws amplify list-jobs --app-id "${APP_ID}" --branch-name "${TARGET}" --max-results 3 --query "jobSummaries[*].{JobId:jobId,Status:status,CommitId:commitId,StartTime:startTime}" --output table
echo ""

# 4) Check if SOURCE branch exists in Amplify
if aws amplify get-branch --app-id "${APP_ID}" --branch-name "${SOURCE}" >/dev/null 2>&1; then
  echo "🔎 Latest jobs on SOURCE branch (${SOURCE}):"
  aws amplify list-jobs --app-id "${APP_ID}" --branch-name "${SOURCE}" --max-results 2 --query "jobSummaries[*].{JobId:jobId,Status:status,CommitId:commitId}" --output table
else
  echo "ℹ️ SOURCE branch (${SOURCE}) not configured in Amplify (expected - it was merged)"
fi
echo ""

# 5) Get latest job details
LATEST_JOB="$(aws amplify list-jobs --app-id "${APP_ID}" --branch-name "${TARGET}" --max-results 1 --query "jobSummaries[0]" --output json)"
JOB_ID="$(echo "$LATEST_JOB" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")"
JOB_STATUS="$(echo "$LATEST_JOB" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")"
COMMIT_ID="$(echo "$LATEST_JOB" | python3 -c "import sys,json; print(json.load(sys.stdin).get('commitId',''))")"
COMMIT_MSG="$(echo "$LATEST_JOB" | python3 -c "import sys,json; print(json.load(sys.stdin).get('commitMessage','')[:80])")"

# 6) Create summary
mkdir -p artifacts
cat > artifacts/which_branch_and_deploy_summary.json <<JSON
{
  "appId": "${APP_ID}",
  "appName": "${APP_NAME}",
  "domain": "${AMPLIFY_DOMAIN}",
  "deployBranch": "${TARGET}",
  "latestJob": {
    "jobId": "${JOB_ID}",
    "status": "${JOB_STATUS}",
    "commitId": "${COMMIT_ID}",
    "commitMessage": "${COMMIT_MSG}"
  },
  "siteUrl": "https://${TARGET}.${AMPLIFY_DOMAIN}",
  "repo": "${REPO_URL}",
  "sourceBranchMerged": true,
  "prNumber": "1",
  "timestamp": "$(date -u +%FT%TZ)"
}
JSON

echo "📄 Summary:"
cat artifacts/which_branch_and_deploy_summary.json | python3 -m json.tool
echo ""
echo "✅ Deployment Status: ${JOB_STATUS}"
echo "🌐 Live URL: https://${TARGET}.${AMPLIFY_DOMAIN}"
echo "📝 Summary saved: artifacts/which_branch_and_deploy_summary.json"
