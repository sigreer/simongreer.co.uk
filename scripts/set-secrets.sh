#!/usr/bin/env bash
# Script to set Cloudflare Pages secrets from .dev.vars file
# Usage: ./scripts/set-secrets.sh

set -e

PROJECT_NAME="simongreer"

echo "🔐 Setting Cloudflare Pages secrets for project: $PROJECT_NAME"
echo ""

if [ ! -f .dev.vars ]; then
    echo "❌ Error: .dev.vars file not found"
    echo "Please create a .dev.vars file with your secrets"
    exit 1
fi

# Read secrets from .dev.vars and set them
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^# ]] && continue

    # Only set secret variables (ones that should be encrypted)
    if [[ "$key" =~ ^(MAILTRAP_API_KEY|MAILTRAP_FROM_EMAIL|MAILTRAP_TO_EMAIL)$ ]]; then
        echo "Setting secret: $key"
        # Remove quotes from value if present
        clean_value=$(echo "$value" | sed 's/^"//;s/"$//')
        echo "$clean_value" | wrangler pages secret put "$key" --project-name="$PROJECT_NAME"
        echo "✅ $key set successfully"
        echo ""
    fi
done < .dev.vars

echo "🎉 All secrets have been set!"
echo ""
echo "Note: You may need to trigger a new deployment for the secrets to take effect."
echo "Run: git commit --allow-empty -m 'Trigger deployment' && git push"
