#!/usr/bin/env bash

# Script to push main branch to remote for preview deployment
# Usage: bun run push-preview

set -e

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if we're on main branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: Not currently on main branch (current: $CURRENT_BRANCH)${NC}"
    echo "Switch to main branch first with: git checkout main"
    exit 1
fi

# Fetch latest from remote
echo "Fetching latest from remote..."
git fetch origin

# Check if main is behind production
MAIN_COMMITS=$(git rev-list --count origin/main..origin/production 2>/dev/null || echo "0")
if [ "$MAIN_COMMITS" -gt 0 ]; then
    echo -e "${RED}Error: Main branch is behind production by $MAIN_COMMITS commit(s)${NC}"
    echo "Consider merging production into main first, or use 'git log origin/main..origin/production' to review"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Warning: You have uncommitted changes in main${NC}"
    git status --short
    echo ""
    echo -e "Press ${GREEN}Enter${NC} to continue anyway, or ${RED}Ctrl+C${NC} to cancel and commit changes first"
    read -r
fi

# Check if local main is behind remote main
LOCAL_BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [ "$LOCAL_BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}Warning: Your local main is behind origin/main by $LOCAL_BEHIND commit(s)${NC}"
    echo -e "Press ${GREEN}Enter${NC} to pull and continue, or ${RED}Ctrl+C${NC} to cancel"
    read -r
    git pull origin main
fi

# Push to remote
echo -e "${GREEN}Pushing main branch to remote...${NC}"
git push origin main

echo -e "${GREEN}✓ Successfully pushed main to remote${NC}"
echo "Preview deployment will be triggered via GitHub Actions"
