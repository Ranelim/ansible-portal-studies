# Ansible Self-Service Portal -- UX Prototype Setup

This guide walks you through running the UX prototype locally. The prototype is built on upstream Backstage and connects to an Ansible Automation Platform (AAP) instance to display live data such as software templates, execution environments, and collections.

## Prerequisites

- **Node.js** 20 or 22 (LTS). Install via [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org/).
- **Corepack** enabled: `corepack enable`
- **Git**: `git --version`

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Ranelim/ansible-backstage-plugins.git
cd ansible-backstage-plugins
git checkout feat/self-service-ux-prototype
./install-deps
```

### 2. Create your local config

```bash
cp app-config.local.yaml.example app-config.local.yaml
```

Open `app-config.local.yaml` and replace the placeholders with real values. See [Where to get the credentials](#where-to-get-the-credentials) below.

### 3. Start the app

```bash
yarn start
```

Wait 2-3 minutes for the initial build. Once you see `webpack compiled successfully`, open:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:7007

### 4. Sign in

On the login screen, choose **Guest** to browse the UI without AAP authentication, or **RHAAP** to sign in with your AAP user account.

> **Note:** Guest mode lets you explore the navigation and layout. Some pages that pull live data from AAP (Software Templates, Execution Environments, Collections) require either a valid backend API token in the config or an RHAAP sign-in.

---

## Where to Get the Credentials

Your `app-config.local.yaml` needs four values from an AAP instance. Ask the prototype maintainer or your AAP administrator for these.

| Placeholder | What it is | Where to find it |
|---|---|---|
| `<AAP_HOST>` | AAP controller hostname or IP | The URL you use to access the AAP web UI (e.g. `aap.example.com`) |
| `<AAP_OAUTH_CLIENT_ID>` | OAuth2 application client ID | AAP UI: Administration > Applications > your OAuth app |
| `<AAP_OAUTH_CLIENT_SECRET>` | OAuth2 application client secret | Shown once when the OAuth app is created |
| `<AAP_API_TOKEN>` | Personal API token for backend calls | AAP UI: Users > your user > Tokens > Add |

### Setting up the AAP OAuth application

If an OAuth application does not already exist on the AAP instance, you or your AAP admin will need to create one. Follow the official Red Hat documentation:

[Pre-installation configuration -- Installing self-service automation portal (Red Hat AAP 2.6)](https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/2.6/html/installing_self-service_automation_portal/self-service-preinstall-config_aap-self-service-install)

Key settings when creating the OAuth application in AAP:

- **Authorization grant type**: Authorization code
- **Redirect URIs**: `http://localhost:7007/api/auth/rhaap/handler/frame`
- **Client type**: Confidential

---

## Viewing Without AAP (UI-Only Mode)

If you just want to see the sidebar layout and navigation without connecting to AAP:

1. Create a minimal `app-config.local.yaml`:

```yaml
signInPage: guest

auth:
  environment: development
  providers:
    guest:
      dangerouslyAllowOutsideDevelopment: false
```

2. Run `yarn start` and sign in as Guest. You will see the redesigned sidebar and navigation structure. AAP-dependent pages will show empty states or errors since there is no backend data source.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Port 3000 or 7007 already in use | `lsof -ti:3000 \| xargs kill -9` then retry |
| SSL errors connecting to AAP | Ensure `checkSSL: false` is set in your local config (development only) |
| "Login to AAP required" modal | Sign in via the RHAAP provider, or verify your `token` value in the config |
| Build runs out of memory | `export NODE_OPTIONS="--max-old-space-size=16384"` then retry |
| Plugins not loading after pull | `yarn clean && yarn install && yarn start` |

## Security Notice

**Never commit `app-config.local.yaml` to version control.** This file contains sensitive credentials and is excluded via `.gitignore`. Share credentials only through secure channels (1Password, Slack DM, internal vault, etc.).
