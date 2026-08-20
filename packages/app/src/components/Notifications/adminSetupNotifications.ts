import type { AttentionKey } from '@ansible/plugin-backstage-self-service';

export type AdminSetupNotification = {
  id: string;
  title: string;
  description: string;
  detail: string;
  entity: string;
  href: string;
  ctaLabel: string;
  attentionKey: AttentionKey;
};

/**
 * Admin-only setup tasks for the notifications center.
 * Appear while the matching setup is incomplete; drop after it is done.
 */
export function getAdminSetupNotifications(opts: {
  devSpacesConnected: boolean;
  orchestratorSetup: boolean;
}): AdminSetupNotification[] {
  const items: AdminSetupNotification[] = [];

  if (!opts.devSpacesConnected) {
    items.push({
      id: 'admin-setup-devspaces',
      title: 'Dev Spaces needs setup',
      description:
        'Connect OpenShift Dev Spaces so developers can edit Git Repositories in the browser.',
      detail:
        'Paste a Dev Spaces instance URL on Integrations. Until then, Edit in Dev Spaces stays hidden on Git Repositories.',
      entity: 'OpenShift Dev Spaces',
      href: '/self-service/admin/integrations/devspaces',
      ctaLabel: 'Set up Dev Spaces',
      attentionKey: 'integrations-needs-setup',
    });
  }

  if (!opts.orchestratorSetup) {
    items.push({
      id: 'admin-setup-orchestrator',
      title: 'Orchestrator needs setup',
      description:
        'Finish setup before Orchestrator appears on the Experiences Bridge.',
      detail:
        'Certified Automation Orchestrator workflows and extra node types. Complete setup to enable this experience for users.',
      entity: 'Orchestrator',
      href: '/self-service/admin/experiences/orchestrator/setup',
      ctaLabel: 'Set up Orchestrator',
      attentionKey: 'experiences-discover',
    });
  }

  return items;
}
