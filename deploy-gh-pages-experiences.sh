#!/bin/bash
# Deploy Plugin Factory / Experiences shell prototype to GitHub Pages
# under ansible-portal-studies/plugin-factory/
# Source stays private; only the built SPA is pushed to Ranelim/ansible-portal-studies.
set -e

GH_PAGES_REPO="https://github.com/Ranelim/ansible-portal-studies.git"
SUBPATH="plugin-factory"
GH_PAGES_URL="https://ranelim.github.io/ansible-portal-studies/${SUBPATH}"
ACCESS_CODE="cedar-nimbus"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="${REPO_ROOT}/.gh-pages-deploy"
SIGNIN_FILE="${REPO_ROOT}/packages/app/src/components/SignIn/CustomSignInPage.tsx"

echo "=== Automation Portal — GitHub Pages Deploy (Plugin Factory) ==="
echo ""
echo "URL:         ${GH_PAGES_URL}/"
echo "Access code: ${ACCESS_CODE}"
echo "Source:      latest commit on design/portal-experiences-shell"
echo ""

cd "$REPO_ROOT"

# 1. Install dependencies
echo "[1/6] Installing dependencies..."
yarn install --frozen-lockfile 2>/dev/null || yarn install

# 2. Temporarily set study access code for this build only
echo "[2/6] Setting study access code for build..."
if [ ! -f "$SIGNIN_FILE" ]; then
  echo "Error: missing ${SIGNIN_FILE}"
  exit 1
fi
cp "$SIGNIN_FILE" "${SIGNIN_FILE}.bak"
python3 - <<PY
from pathlib import Path
import re
path = Path("${SIGNIN_FILE}")
text = path.read_text()
text2, n = re.subn(
    r"const STUDY_ACCESS_CODE = '[^']*';",
    "const STUDY_ACCESS_CODE = '${ACCESS_CODE}';",
    text,
    count=1,
)
if n != 1:
    raise SystemExit(f"Expected to replace STUDY_ACCESS_CODE once, got {n}")
path.write_text(text2)
print(f"STUDY_ACCESS_CODE -> ${ACCESS_CODE}")
PY

restore_signin() {
  if [ -f "${SIGNIN_FILE}.bak" ]; then
    mv "${SIGNIN_FILE}.bak" "$SIGNIN_FILE"
    echo "Restored CustomSignInPage.tsx"
  fi
}
trap restore_signin EXIT

# 3. Swap in the static build config (subdir baseUrl)
echo "[3/6] Setting up static build config..."
if [ -f app-config.local.yaml ]; then
  cp app-config.local.yaml app-config.local.yaml.bak
fi

cat > app-config.local.yaml << EOF
app:
  baseUrl: ${GH_PAGES_URL}
backend:
  baseUrl: ${GH_PAGES_URL}
signInPage: guest
auth:
  providers:
    guest:
      dangerouslyAllowOutsideDevelopment: true
permission:
  enabled: false
EOF

# 4. Build the frontend
echo "[4/6] Generating types + building frontend (this takes several minutes)..."
yarn tsc --pretty false --noEmitOnError false || true
yarn build:all

# 5. Restore local config + sign-in source
echo "[5/6] Restoring local config..."
if [ -f app-config.local.yaml.bak ]; then
  mv app-config.local.yaml.bak app-config.local.yaml
else
  rm -f app-config.local.yaml
fi
restore_signin
trap - EXIT

# Rewrite root-absolute /static/ paths if the bundler emitted them
INDEX_HTML="packages/app/dist/index.html"
if [ ! -f "$INDEX_HTML" ]; then
  echo "Error: missing ${INDEX_HTML}"
  exit 1
fi
if grep -qE 'src="/static/|href="/static/' "$INDEX_HTML"; then
  echo "Warning: dist uses root-absolute /static/ — rewriting to /ansible-portal-studies/${SUBPATH}/static/"
  sed -i.bak -E "s|(src|href)=\"/static/|\\1=\"/ansible-portal-studies/${SUBPATH}/static/|g" "$INDEX_HTML"
  rm -f "${INDEX_HTML}.bak"
fi

# 6. Deploy into studies repo subdirectory only
echo "[6/6] Deploying to GitHub Pages under ${SUBPATH}/..."
rm -rf "$DEPLOY_DIR"

if ! git clone --depth 1 "$GH_PAGES_REPO" "$DEPLOY_DIR"; then
  echo "Error: could not clone ${GH_PAGES_REPO}"
  exit 1
fi

cd "$DEPLOY_DIR"
git config http.postBuffer 524288000

rm -rf "${DEPLOY_DIR}/${SUBPATH}"
mkdir -p "${DEPLOY_DIR}/${SUBPATH}"
cp -R "${REPO_ROOT}/packages/app/dist/." "${DEPLOY_DIR}/${SUBPATH}/"
SPA_INDEX="${DEPLOY_DIR}/${SUBPATH}/index.html"
cp "$SPA_INDEX" "${DEPLOY_DIR}/${SUBPATH}/404.html"
touch "${DEPLOY_DIR}/.nojekyll"

# Real files for client routes. GitHub Pages 404 at the site root is a trampoline;
# these copies make common paths return 200 instead of 404.
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
  dest_dir="${DEPLOY_DIR}/${SUBPATH}/${rel}"
  mkdir -p "$dest_dir"
  cp "$SPA_INDEX" "${dest_dir}/index.html"
  parent="$(dirname "$dest_dir")"
  base="$(basename "$dest_dir")"
  cp "$SPA_INDEX" "${parent}/${base}.html"
done

# Site-root 404 trampoline: missing paths under /plugin-factory/ load that SPA.
cat > "${DEPLOY_DIR}/404.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Automation Portal</title>
  <script>
    (function () {
      var p = location.pathname || '';
      var prefix = '/ansible-portal-studies/plugin-factory';
      if (p.indexOf(prefix) === 0) {
        fetch(prefix + '/index.html', { credentials: 'same-origin' })
          .then(function (r) { return r.text(); })
          .then(function (html) {
            document.open();
            document.write(html);
            document.close();
          });
        return;
      }
      location.replace('/ansible-portal-studies/');
    })();
  </script>
</head>
<body>Loading prototype…</body>
</html>
EOF

cat > "${DEPLOY_DIR}/index.html" << EOF
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex"/>
  <title>Automation Portal studies</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 4rem auto; max-width: 36rem; color: #151515; line-height: 1.5; }
    h1 { font-size: 1.25rem; font-weight: 600; }
    p, li { color: #6a6e73; }
    a { color: #0066cc; }
  </style>
</head>
<body>
  <h1>Automation Portal studies</h1>
  <p>Password-gated static prototypes. Access codes are shared separately.</p>
  <ul>
    <li><a href="./plugin-factory/">Plugin Factory</a> — Experiences shell</li>
  </ul>
</body>
</html>
EOF

if [ -f README.md ]; then
  cat > README.md << EOF
# Ansible Portal Studies

Static prototype deployments for usability studies. Each subdirectory is an independent study.

GitHub Pages: https://ranelim.github.io/ansible-portal-studies/

## plugin-factory (Experiences shell)

- URL: ${GH_PAGES_URL}/
- Access code: shared separately with the team
- Source: \`design/portal-experiences-shell\` (built files only)

APME study paths (\`apme-integration/\`, \`apme-latest/\`) are retired placeholders.
EOF
fi

git add -A
git commit -m "Deploy ${SUBPATH} — $(date '+%Y-%m-%d %H:%M')" || {
  echo "No changes to deploy."
  cd "$REPO_ROOT"
  rm -rf "$DEPLOY_DIR"
  exit 0
}
git push origin HEAD

cd "$REPO_ROOT"
rm -rf "$DEPLOY_DIR"

echo ""
echo "=== Deployed! ==="
echo ""
echo "Prototype:     ${GH_PAGES_URL}/"
echo "Bridge:        ${GH_PAGES_URL}/self-service/experiences"
echo "Access code:   ${ACCESS_CODE}"
echo ""
echo "GitHub Pages may take 1-2 minutes to update."
echo ""
