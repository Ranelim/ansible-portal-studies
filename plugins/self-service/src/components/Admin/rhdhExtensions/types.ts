/*
 * Vendored from redhat-developer/rhdh-plugins
 * workspaces/extensions/plugins/extensions-common — types needed by PluginCard.
 * Source of truth: https://github.com/redhat-developer/rhdh-plugins
 */

import type { Entity } from '@backstage/catalog-model';

/** @public */
export enum ExtensionsSupportLevel {
  GENERALLY_AVAILABLE = 'generally-available',
  TECH_PREVIEW = 'tech-preview',
  DEV_PREVIEW = 'dev-preview',
  COMMUNITY = 'community',
  NONE = 'none',
}

/** @public */
export type ExtensionsSupport = {
  provider?: string;
  level?: ExtensionsSupportLevel;
};

/** @public */
export type ExtensionsAuthor = {
  name: string;
  email?: string;
  url?: string;
};

/** @public */
export enum ExtensionsPluginInstallStatus {
  NotInstalled = 'NotInstalled',
  Installed = 'Installed',
  PartiallyInstalled = 'PartiallyInstalled',
  Disabled = 'Disabled',
  UpdateAvailable = 'UpdateAvailable',
}

/** @public */
export interface ExtensionsPluginSpec {
  icon?: string;
  author?: string;
  authors?: ExtensionsAuthor[];
  support?: ExtensionsSupport;
  categories?: string[];
  highlights?: string[];
  description?: string;
  installStatus?: ExtensionsPluginInstallStatus;
}

/** @public */
export interface ExtensionsPlugin extends Entity {
  spec?: ExtensionsPluginSpec;
}

/** Annotation used by Badges for pre-installed detection */
export const ExtensionsAnnotation = {
  PRE_INSTALLED: 'extensions.redhat.com/pre-installed',
} as const;
