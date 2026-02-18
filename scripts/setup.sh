#!/bin/bash
set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="sensa-os-ac840"
PROJECT_NUMBER="242388655453"
APP_URL="https://quickal.vercel.app"
CALLBACK_URL="$APP_URL/api/auth/callback/google"

echo -e "${BLUE}━━━ Quickal Setup ━━━${NC}\n"

# 1. Check gcloud
if ! command -v gcloud &>/dev/null; then
  echo -e "${RED}gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install${NC}"
  exit 1
fi

# 2. Auth
echo -e "${BLUE}[1/6] Authenticating with Google Cloud...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
  gcloud auth login --no-launch-browser
fi
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)
echo -e "${GREEN}  Authenticated as: $ACCOUNT${NC}"

# 3. Set project
gcloud config set project "$PROJECT_ID" 2>/dev/null

# 4. Enable APIs
echo -e "${BLUE}[2/6] Enabling APIs...${NC}"
for api in calendar-json.googleapis.com generativelanguage.googleapis.com; do
  gcloud services enable "$api" 2>/dev/null && echo -e "${GREEN}  Enabled: $api${NC}" || echo "  Already enabled: $api"
done

# 5. Create OAuth client
echo -e "${BLUE}[3/6] Creating OAuth 2.0 client for Quickal...${NC}"
OAUTH_RESULT=$(gcloud alpha iap oauth-brands list --format=json 2>/dev/null || echo "[]")

# Use REST API to create OAuth client
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

CLIENT_RESPONSE=$(curl -s -X POST \
  "https://www.googleapis.com/oauth2/v1/projects/${PROJECT_ID}/oauthClients" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"displayName\": \"Quickal Web\",
    \"redirectUris\": [\"$CALLBACK_URL\"],
    \"javascriptOrigins\": [\"$APP_URL\"]
  }" 2>/dev/null || echo "{}")

# Fallback: try the Cloud Console API
if echo "$CLIENT_RESPONSE" | grep -q "error"; then
  echo "  Using alternative method..."
  CLIENT_RESPONSE=$(curl -s -X POST \
    "https://oauth2.googleapis.com/projects/${PROJECT_NUMBER}/oauthClients" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"displayName\": \"Quickal Web\",
      \"applicationType\": \"WEB\",
      \"redirectUris\": [\"$CALLBACK_URL\"],
      \"allowedJavascriptOrigins\": [\"$APP_URL\"]
    }" 2>/dev/null || echo "{}")
fi

NEW_CLIENT_ID=$(echo "$CLIENT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('clientId',''))" 2>/dev/null || echo "")
NEW_CLIENT_SECRET=$(echo "$CLIENT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('clientSecret',''))" 2>/dev/null || echo "")

if [ -z "$NEW_CLIENT_ID" ]; then
  echo -e "${RED}  Could not create OAuth client via API.${NC}"
  echo -e "  Please create manually at: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
  echo -e "  Type: Web application, Name: Quickal"
  echo -e "  Authorized origins: $APP_URL"
  echo -e "  Authorized redirect URIs: $CALLBACK_URL"
  echo ""
  read -p "  Enter Client ID: " NEW_CLIENT_ID
  read -p "  Enter Client Secret: " NEW_CLIENT_SECRET
fi
echo -e "${GREEN}  OAuth Client: $NEW_CLIENT_ID${NC}"

# 6. Create Gemini API key
echo -e "${BLUE}[4/6] Creating Gemini API key...${NC}"
GEMINI_KEY=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/apiKeys?key=none" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"quickal"}' 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('apiKey',''))" 2>/dev/null || echo "")

if [ -z "$GEMINI_KEY" ]; then
  echo -e "  Get a free key at: https://aistudio.google.com/apikey"
  read -p "  Enter Gemini API Key: " GEMINI_KEY
fi
echo -e "${GREEN}  Gemini key: ${GEMINI_KEY:0:12}...${NC}"

# 7. Set Vercel env vars
echo -e "${BLUE}[5/6] Configuring Vercel...${NC}"
if command -v vercel &>/dev/null; then
  echo "$NEW_CLIENT_ID" | vercel env add GOOGLE_CLIENT_ID production --force 2>/dev/null || true
  echo "$NEW_CLIENT_SECRET" | vercel env add GOOGLE_CLIENT_SECRET production --force 2>/dev/null || true
  echo "$GEMINI_KEY" | vercel env add GOOGLE_GENERATIVE_AI_API_KEY production --force 2>/dev/null || true
  echo -e "${GREEN}  Vercel env vars updated${NC}"
else
  echo -e "  Add these to Vercel dashboard (https://vercel.com/manugameros-projects/quickal/settings/environment-variables):"
  echo "  GOOGLE_CLIENT_ID=$NEW_CLIENT_ID"
  echo "  GOOGLE_CLIENT_SECRET=$NEW_CLIENT_SECRET"
  echo "  GOOGLE_GENERATIVE_AI_API_KEY=$GEMINI_KEY"
fi

# 8. Redeploy
echo -e "${BLUE}[6/6] Deploying...${NC}"
if command -v vercel &>/dev/null; then
  vercel deploy --prod --yes 2>/dev/null | tail -3
fi

echo -e "\n${GREEN}━━━ Setup complete! ━━━${NC}"
echo -e "Open: $APP_URL"
