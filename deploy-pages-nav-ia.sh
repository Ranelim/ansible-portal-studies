#!/bin/bash
# Deploy Portal nav IA prototype to GitLab Pages under /portal-nav-ia/
# without replacing the root deploy (currently APME).
set -e

PAGES_HOST="https://ansible-portal-prototypes-c8c2a0.pages.redhat.com"
SUBPATH="portal-nav-ia"
PAGES_URL="${PAGES_HOST}/${SUBPATH}"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
GL_PAGES_DIR="${REPO_ROOT}/.gl-pages-deploy"

echo "=== Ansible Portal — GitLab Pages Deploy (Nav IA subdirectory) ==="
echo ""
echo "URL:  ${PAGES_URL}/"
echo "Note: Root Pages content (APME) is preserved."
echo ""

cd "$REPO_ROOT"

# 1. Swap in the static build config (subdir baseUrl)
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

# 4. Verify asset paths are subpath-aware (not domain-root absolute)
INDEX_HTML="packages/app/dist/index.html"
if [ -f "$INDEX_HTML" ]; then
  if grep -qE 'src="/static/|href="/static/' "$INDEX_HTML"; then
    echo "Warning: dist uses root-absolute /static/ paths — rewriting to /${SUBPATH}/static/"
    # Portable in-place rewrite for macOS sed
    sed -i.bak -E "s|(src|href)=\"/static/|\\1=\"/${SUBPATH}/static/|g" "$INDEX_HTML"
    rm -f "${INDEX_HTML}.bak"
  fi
fi

# 5. Deploy into public/portal-nav-ia only (preserve sibling content)
echo "[4/5] Deploying to gl-pages under public/${SUBPATH}/..."
rm -rf "$GL_PAGES_DIR"
git worktree prune 2>/dev/null || true
git fetch gitlab gl-pages
git worktree add "$GL_PAGES_DIR" gitlab/gl-pages

rm -rf "${GL_PAGES_DIR}/public/${SUBPATH}"
mkdir -p "${GL_PAGES_DIR}/public/${SUBPATH}"
cp -R packages/app/dist/. "${GL_PAGES_DIR}/public/${SUBPATH}/"
cp "${GL_PAGES_DIR}/public/${SUBPATH}/index.html" "${GL_PAGES_DIR}/public/${SUBPATH}/404.html"

# Lightweight index pointer so reviewers can discover the subpath from root
# without replacing the APME SPA at public/index.html
cat > "${GL_PAGES_DIR}/public/nav-ia.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=/${SUBPATH}/" />
  <title>Portal Nav IA prototype</title>
  <link rel="canonical" href="${PAGES_URL}/" />
</head>
<body>
  <p>Redirecting to <a href="/${SUBPATH}/">Portal Nav IA prototype</a>…</p>
</body>
</html>
EOF

cd "$GL_PAGES_DIR"
git add -A
git commit -m "Deploy Nav IA prototype to /${SUBPATH}/ $(date '+%Y-%m-%d %H:%M')" || {
  echo "No changes to deploy."
  cd "$REPO_ROOT"
  git worktree remove "$GL_PAGES_DIR" --force 2>/dev/null || true
  exit 0
}
git push gitlab HEAD:gl-pages

# Clean up
cd "$REPO_ROOT"
git worktree remove "$GL_PAGES_DIR" --force 2>/dev/null || true
git branch -D gl-pages 2>/dev/null || true

echo ""
echo "=== Deployed! ==="
echo "Nav IA:  ${PAGES_URL}/"
echo "Shortcut: ${PAGES_HOST}/nav-ia.html"
echo "APME root left intact: ${PAGES_HOST}/"
echo ""
echo "Allow 2–5 min for GitLab Pages + CDN; hard refresh if chunks look stale."
echo "Deep links: open from in-app nav after landing on ${PAGES_URL}/ (GitLab serves root 404 for unknown paths)."
echo ""
