import type { AttentionKey, SetupExperienceId } from '@ansible/plugin-backstage-self-service';
import { SHOW_ORCHESTRATOR_EXPERIENCE } from '@ansible/plugin-backstage-self-service';

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

const EXPERIENCE_SETUP_COPY: Record<
  SetupExperienceId,
  { title: string; description: string; detail: string; entity: string }
> = {
  develop: {
    title: 'Develop needs setup',
    description:
      'Connect Git before Develop can launch. Private Automation Hub is optional.',
    detail:
      'Git is the gate for Develop. Finish setup so developers can work with repositories.',
    entity: 'Develop',
  },
  compliance: {
    title: 'Compliance needs setup',
    description:
      'Finish setup before Compliance appears with Launch on the Experiences Bridge.',
    detail:
      'Enable Compliance so operators can scan inventories, review findings, and remediate hosts.',
    entity: 'Compliance',
  },
  edge: {
    title: 'Edge needs setup',
    description:
      'Finish setup before Edge appears with Launch on the Experiences Bridge.',
    detail:
      'Enable Edge so operators can manage device fleets, desired state, and updates.',
    entity: 'Edge',
  },
  orchestrator: {
    title: 'Orchestrator needs setup',
    description:
      'Finish setup before Orchestrator appears on the Experiences Bridge.',
    detail:
      'Certified Automation Orchestrator workflows and extra node types. Complete setup to enable this experience for users.',
    entity: 'Orchestrator',
  },
};

/**
 * Admin-only setup tasks for the notifications center.
 * Appear while the matching setup is incomplete; drop after it is done.
 */
export function getAdminSetupNotifications(opts: {
  devSpacesConnected: boolean;
  isExperienceReady: (id: SetupExperienceId) => boolean;
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

  (Object.keys(EXPERIENCE_SETUP_COPY) as SetupExperienceId[]).forEach(id => {
    if (!SHOW_ORCHESTRATOR_EXPERIENCE && id === 'orchestrator') return;
    if (opts.isExperienceReady(id)) return;
    const copy = EXPERIENCE_SETUP_COPY[id];
    items.push({
      id: `admin-setup-${id}`,
      title: copy.title,
      description: copy.description,
      detail: copy.detail,
      entity: copy.entity,
      href: `/self-service/admin/experiences/${id}/setup`,
      ctaLabel: `Set up ${copy.entity}`,
      attentionKey: 'experiences-discover',
    });
  });

  return items;
}
