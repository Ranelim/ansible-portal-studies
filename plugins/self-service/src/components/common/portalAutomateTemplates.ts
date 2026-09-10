/**
 * Automate / Create catalog templates — keep in sync with
 * `packages/app/src/components/scaffolder/PortalCreatePage.tsx` DEMO_TEMPLATES.
 */
export const PORTAL_AUTOMATE_TEMPLATE_NAMES = [
  'create-playbook-project',
  'create-cloud-provisioning-project',
  'create-network-automation-project',
  'aws-provisioning-workflow',
  'deploy-database-update',
  'rhel-server-patching',
  'orch-restart-service-on-alert',
  'orch-emergency-change',
  'orch-scale-on-demand',
] as const;

export const PORTAL_AUTOMATE_TEMPLATE_COUNT =
  PORTAL_AUTOMATE_TEMPLATE_NAMES.length;
