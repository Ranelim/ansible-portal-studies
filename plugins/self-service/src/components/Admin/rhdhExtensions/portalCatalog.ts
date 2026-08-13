/*
 * Portal demo catalog entities shaped as RHDH ExtensionsPlugin
 * so we can render the vendored PluginCard 1:1.
 */

import {
  ExtensionsPlugin,
  ExtensionsPluginInstallStatus,
  ExtensionsSupportLevel,
} from './types';

export type PortalPluginExtras = {
  experiences: string[];
  hosts: string[];
  surfacePath: string;
  doesNot: string[];
  about: string;
  configHref?: string;
  configLabel?: string;
  openSurfaceHref?: string;
  openSurfaceLabel?: string;
};

export type PortalCatalogEntry = {
  plugin: ExtensionsPlugin;
  extras: PortalPluginExtras;
};

function entity(
  name: string,
  title: string,
  description: string,
  opts: {
    category: string;
    highlights: string[];
    installStatus: ExtensionsPluginInstallStatus;
    supportLevel: ExtensionsSupportLevel;
    extras: PortalPluginExtras;
  },
): PortalCatalogEntry {
  return {
    plugin: {
      apiVersion: 'extensions.redhat.com/v1alpha1',
      kind: 'Plugin',
      metadata: {
        name,
        title,
        description,
        namespace: 'default',
        annotations: {
          'extensions.redhat.com/pre-installed': 'true',
        },
      },
      spec: {
        authors: [{ name: 'Red Hat' }],
        categories: [opts.category],
        highlights: opts.highlights,
        installStatus: opts.installStatus,
        support: {
          level: opts.supportLevel,
          provider: 'Red Hat',
        },
      },
    },
    extras: opts.extras,
  };
}

export const PORTAL_CATALOG: PortalCatalogEntry[] = [
  entity('self-service', 'Self-service', 'Core Portal surfaces: Git Repositories, Templates, Activity, and shared Admin.', {
    category: 'Develop',
    highlights: [
      'Git Repositories object home',
      'Templates and Activity (Run)',
      'Shared Administration surfaces',
    ],
    installStatus: ExtensionsPluginInstallStatus.Installed,
    supportLevel: ExtensionsSupportLevel.GENERALLY_AVAILABLE,
    extras: {
      experiences: ['Develop', 'Cross-cutting'],
      hosts: ['Git Repositories', 'Templates'],
      surfacePath: 'Develop · Git Repositories · list + Templates / Activity',
      doesNot: ['Create a separate Experience tile', 'Replace Integrations'],
      about:
        'Baseline Automation Portal capability. Provides object homes and run surfaces that other plugins extend (Class B).',
    },
  }),
  entity(
    'apme',
    'APME Quality Scanning',
    'Quality analysis on Git repositories. Target AAP version is wired under Integrations.',
    {
      category: 'Develop',
      highlights: [
        'Quality tab on Git Repositories',
        'Preview chip on primary entry points',
        'SARIF annotations in Dev Spaces',
      ],
      installStatus: ExtensionsPluginInstallStatus.Installed,
      supportLevel: ExtensionsSupportLevel.TECH_PREVIEW,
      extras: {
        experiences: ['Develop'],
        hosts: ['Git Repositories'],
        surfacePath: 'Develop · Git Repositories · Quality tab',
        doesNot: [
          'Add a left-nav row',
          'Create an Experience tile',
          'Replace Integrations for AAP target config',
        ],
        about:
          'Multi-validator static analysis for Ansible content. When enabled, a Quality tab appears on the Git Repositories host inside the Develop experience.',
        configHref: '/self-service/admin/integrations',
        configLabel: 'Open Integrations',
        openSurfaceHref: '/self-service/repositories',
        openSurfaceLabel: 'Open Git Repositories',
      },
    },
  ),
  entity(
    'compliance',
    'Compliance scanning',
    'Scan and remediate hosts against compliance profiles on Inventories.',
    {
      category: 'Compliance',
      highlights: [
        'Compliance tabs on Inventories',
        'Profile and findings workflows',
        'Remediation playbook path',
      ],
      installStatus: ExtensionsPluginInstallStatus.Installed,
      supportLevel: ExtensionsSupportLevel.TECH_PREVIEW,
      extras: {
        experiences: ['Compliance'],
        hosts: ['Inventories'],
        surfacePath: 'Compliance · Inventories · Compliance tabs',
        doesNot: [
          'Add a “Compliance” left-nav sibling under Operate',
          'Nest Edge fleets under Inventories',
        ],
        about:
          'Feeds the Compliance experience. Primary object is Inventories — compliance UI attaches as domain tabs on that host.',
        openSurfaceHref: '/self-service/inventories',
        openSurfaceLabel: 'Open Inventories',
      },
    },
  ),
  entity(
    'devspaces',
    'Dev Spaces',
    'Adds “Edit in Dev Spaces” on projects. Wire the OpenShift URL under Integrations.',
    {
      category: 'Develop',
      highlights: [
        'Edit in Dev Spaces on repositories',
        'Ansible extension + Lightspeed in workspace',
        'Connection configured under Integrations',
      ],
      installStatus: ExtensionsPluginInstallStatus.Installed,
      supportLevel: ExtensionsSupportLevel.GENERALLY_AVAILABLE,
      extras: {
        experiences: ['Develop'],
        hosts: ['Git Repositories'],
        surfacePath: 'Develop · Git Repositories · Edit in Dev Spaces',
        doesNot: [
          'Add a Dev Spaces Admin rail item',
          'Create an Experience tile',
        ],
        about:
          'Browser-based VS Code workspaces. Actions appear on Git Repositories; connection lives under Integrations → Developer tools.',
        configHref: '/self-service/admin/integrations/devspaces',
        configLabel: 'Configure connection',
        openSurfaceHref: '/self-service/repositories',
        openSurfaceLabel: 'Open Git Repositories',
      },
    },
  ),
  entity(
    'ee-builder',
    'EE Builder',
    'Execution Environment build configuration (base images, registries, timeouts).',
    {
      category: 'Administration',
      highlights: [
        'Base image and registry settings',
        'Build timeouts and policies',
        'Opened from Plugins, not a rail item',
      ],
      installStatus: ExtensionsPluginInstallStatus.Disabled,
      supportLevel: ExtensionsSupportLevel.DEV_PREVIEW,
      extras: {
        experiences: ['Administration', 'Develop'],
        hosts: ['Administration'],
        surfacePath: 'Administration · EE Builder settings',
        doesNot: ['Add EE Builder as its own Admin rail row'],
        about:
          'Admin configuration for building execution environments. Reached from Plugins — not a separate Administration rail item.',
        configHref: '/self-service/admin/ee-builder',
        configLabel: 'Open EE Builder',
      },
    },
  ),
  entity(
    'notifications',
    'Notifications',
    'Global inbox and masthead bell. User mute prefs live under Settings → Notifications.',
    {
      category: 'Cross-cutting',
      highlights: [
        'Masthead bell across experiences',
        'Global notifications center',
        'User prefs under Settings → Notifications',
      ],
      installStatus: ExtensionsPluginInstallStatus.Installed,
      supportLevel: ExtensionsSupportLevel.TECH_PREVIEW,
      extras: {
        experiences: ['Cross-cutting'],
        hosts: ['Masthead'],
        surfacePath: 'All experiences · Masthead bell · Notifications center',
        doesNot: [
          'Add a Notifications Experience tile',
          'Add a left-nav Notifications row',
        ],
        about:
          'Cross-experience notifications center. Surfaces in the masthead for all seats; does not create an Experience tile.',
        openSurfaceHref: '/notifications',
        openSurfaceLabel: 'Open notifications',
      },
    },
  ),
  entity(
    'rhem',
    'Edge fleets (RHEM)',
    'Exploration — edge fleet lifecycle. Would add Edge fleets as a Class A object host.',
    {
      category: 'Edge',
      highlights: [
        'Edge fleets object home (Class A)',
        'Devices and Images as host tabs',
        'Exploration / not committed scope',
      ],
      installStatus: ExtensionsPluginInstallStatus.NotInstalled,
      supportLevel: ExtensionsSupportLevel.DEV_PREVIEW,
      extras: {
        experiences: ['Edge'],
        hosts: ['Edge fleets'],
        surfacePath: 'Edge · Edge fleets · list (+ Devices / Images tabs)',
        doesNot: [
          'Label the rail “RHEM”',
          'Nest under Inventories',
          'Create sibling Devices / Images rail rows',
        ],
        about:
          'If landed, feeds an Edge experience with Edge fleets as the primary object. Exploration only.',
      },
    },
  ),
];
