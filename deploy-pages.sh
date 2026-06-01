#!/bin/bash
set -e

PAGES_URL="https://ansible-portal-prototypes-c8c2a0.pages.redhat.com"
WORKTREE_DIR=$(mktemp -d)
CURRENT_BRANCH=$(git branch --show-current)

echo "=== Ansible Portal — GitLab Pages Deploy ==="
echo ""

# 1. Swap in the static build config
echo "[1/5] Setting up static build config..."
if [ -f app-config.local.yaml ]; then
  cp app-config.local.yaml app-config.local.yaml.bak
fi

cat > app-config.local.yaml << EOF
app:
  baseUrl: ${PAGES_URL}
backend:
  baseUrl: ${PAGES_URL}
signInPage: guest
auth:
  providers:
    guest:
      dangerouslyAllowOutsideDevelopment: true
permission:
  enabled: false
EOF

# 2. Build the frontend
echo "[2/5] Building frontend (this takes 2-3 minutes)..."
yarn build:all

# 3. Restore original config
echo "[3/5] Restoring local config..."
if [ -f app-config.local.yaml.bak ]; then
  mv app-config.local.yaml.bak app-config.local.yaml
else
  rm -f app-config.local.yaml
fi

# 4. Deploy to gl-pages branch via worktree
echo "[4/5] Deploying to gl-pages branch..."
git worktree add "$WORKTREE_DIR" gl-pages 2>/dev/null || {
  git worktree prune
  git worktree add "$WORKTREE_DIR" gl-pages
}

rm -rf "$WORKTREE_DIR/public"
cp -r packages/app/dist "$WORKTREE_DIR/public"
cp "$WORKTREE_DIR/public/index.html" "$WORKTREE_DIR/public/404.html"

cd "$WORKTREE_DIR"
git add -A
git commit -m "Deploy prototype $(date '+%Y-%m-%d %H:%M')" || {
  echo "No changes to deploy."
  cd - > /dev/null
  git worktree remove "$WORKTREE_DIR" 2>/dev/null
  exit 0
}
git push gitlab gl-pages

# 5. Clean up
cd - > /dev/null
git worktree remove "$WORKTREE_DIR" 2>/dev/null

echo ""
echo "=== Deployed! ==="
echo "View at: ${PAGES_URL}"
echo ""
