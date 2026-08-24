#!/bin/bash
# Deploy Experiences shell prototype to GitLab Pages under /portal-experiences/
# without replacing the root deploy (APME) or /portal-nav-ia/.
set -e

PAGES_HOST="https://ansible-portal-prototypes-c8c2a0.pages.redhat.com"
SUBPATH="portal-experiences"
PAGES_URL="${PAGES_HOST}/${SUBPATH}"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
GL_PAGES_DIR="${REPO_ROOT}/.gl-pages-deploy"

echo "=== Ansible Portal — GitLab Pages Deploy (Experiences shell) ==="
echo ""
echo "URL:  ${PAGES_URL}/"
echo "Note: Root Pages (APME) and /portal-nav-ia/ are preserved."
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
echo "[2/5] Generating types + building frontend (this takes several minutes)..."
# Prototype branches often have pre-existing tsc errors; still emit dist-types for packaging.
yarn tsc --pretty false --noEmitOnError false || true
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
    sed -i.bak -E "s|(src|href)=\"/static/|\\1=\"/${SUBPATH}/static/|g" "$INDEX_HTML"
    rm -f "${INDEX_HTML}.bak"
  fi
fi

# 5. Deploy into public/portal-experiences only (preserve sibling content)
echo "[4/5] Deploying to gl-pages under public/${SUBPATH}/..."
rm -rf "$GL_PAGES_DIR"
git worktree prune 2>/dev/null || true
git fetch gitlab gl-pages
git worktree add "$GL_PAGES_DIR" gitlab/gl-pages

rm -rf "${GL_PAGES_DIR}/public/${SUBPATH}"
mkdir -p "${GL_PAGES_DIR}/public/${SUBPATH}"
cp -R packages/app/dist/. "${GL_PAGES_DIR}/public/${SUBPATH}/"
INDEX_HTML="${GL_PAGES_DIR}/public/${SUBPATH}/index.html"
# Stamp so View Source can tell this deploy from a cached older SPA.
sed -i.bak "1s|^|<!-- experiences-shell $(date '+%Y-%m-%d %H:%M') -->\\n|" "$INDEX_HTML"
rm -f "${INDEX_HTML}.bak"
cp "$INDEX_HTML" "${GL_PAGES_DIR}/public/${SUBPATH}/404.html"

# Real files on disk for client routes. GitLab Pages only serves files; a refresh
# of /portal-experiences/self-service/experiences otherwise hits the ROOT APME 404.
# Do not use a catch-all /* → /index.html rewrite — that loads APME at this URL.
SPA_PATHS=(
  self-service
  self-service/experiences
  self-service/admin
  self-service/admin/overview
  self-service/repositories
  self-service/repositories/dashboard
  self-service/repositories/quality
  self-service/repositories/remediations
  self-service/repositories/scans
  self-service/assistant
  create
  settings
  notifications
  search
  catalog
)
for rel in "${SPA_PATHS[@]}"; do
  dest_dir="${GL_PAGES_DIR}/public/${SUBPATH}/${rel}"
  mkdir -p "$dest_dir"
  cp "$INDEX_HTML" "${dest_dir}/index.html"
  parent="$(dirname "$dest_dir")"
  base="$(basename "$dest_dir")"
  cp "$INDEX_HTML" "${parent}/${base}.html"
done

# No catch-all. Nested /a/b/c paths often miss a single splat.
cat > "${GL_PAGES_DIR}/public/_redirects" << EOF
/portal-experiences/* /portal-experiences/index.html 200
/portal-experiences/*/* /portal-experiences/index.html 200
/portal-experiences/*/*/* /portal-experiences/index.html 200
/portal-experiences/*/*/*/* /portal-experiences/index.html 200
/portal-nav-ia/* /portal-nav-ia/index.html 200
/compliance/* /compliance/index.html 200
EOF

# Root 404 trampoline: missing paths under /portal-experiences/ load that SPA
# without changing the URL. Other missing paths still load APME.
cat > "${GL_PAGES_DIR}/public/404.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Automation Portal</title>
  <script>
    (function () {
      var p = location.pathname || '';
      var target = '/index.html';
      if (p.indexOf('/portal-experiences') === 0) target = '/portal-experiences/index.html';
      else if (p.indexOf('/portal-nav-ia') === 0) target = '/portal-nav-ia/index.html';
      else if (p.indexOf('/compliance') === 0) target = '/compliance/index.html';
      fetch(target, { credentials: 'same-origin' })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          document.open();
          document.write(html);
          document.close();
        });
    })();
  </script>
</head>
<body>Loading prototype…</body>
</html>
EOF

# Lightweight index pointer so reviewers can discover the subpath from root
cat > "${GL_PAGES_DIR}/public/experiences.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=/${SUBPATH}/" />
  <title>Portal Experiences shell prototype</title>
  <link rel="canonical" href="${PAGES_URL}/" />
</head>
<body>
  <p>Redirecting to <a href="/${SUBPATH}/">Portal Experiences shell prototype</a>…</p>
</body>
</html>
EOF

cd "$GL_PAGES_DIR"
git add -A
git commit -m "Deploy Experiences shell prototype to /${SUBPATH}/ $(date '+%Y-%m-%d %H:%M')" || {
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
echo "Experiences:  ${PAGES_URL}/"
echo "Shortcut: ${PAGES_HOST}/experiences.html"
echo "Nav IA museum: ${PAGES_HOST}/portal-nav-ia/"
echo "APME root left intact: ${PAGES_HOST}/"
echo ""
echo "Allow 2–5 min for GitLab Pages + CDN."
echo "Close the old Plugin Factory tab, then open a new tab (or incognito):"
echo "  ${PAGES_URL}/self-service/experiences"
echo "Refresh should stay on Experiences (file + 404 trampoline). Do not reuse a tab that already loaded APME."
echo ""
