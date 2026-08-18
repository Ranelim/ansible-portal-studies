import type { NavExperience } from '../../../hooks/useNavIaModel';
import {
  APME_CATEGORY_ORDER,
  type ApmeRuleCategory,
} from '../detail/qualityDemoData';

/** Content quality pin vs Git Repositories host tabs / drawer. */
export function scansListPath(experience: NavExperience): string {
  return experience === 'develop-apme'
    ? '/self-service/apme/scans'
    : '/self-service/repositories/scans';
}

export function scanSnapshotPath(
  experience: NavExperience,
  scanId: string,
  opts?: { repo?: string; category?: ApmeRuleCategory },
): string {
  const qs = new URLSearchParams({ scan: scanId });
  if (opts?.repo) qs.set('repo', opts.repo);
  if (opts?.category) qs.set('category', opts.category);
  return `${scansListPath(experience)}?${qs.toString()}`;
}

export function parseScanCategoryParam(
  raw: string | null,
): ApmeRuleCategory | 'all' {
  if (raw && (APME_CATEGORY_ORDER as string[]).includes(raw)) {
    return raw as ApmeRuleCategory;
  }
  return 'all';
}

export function remediationsListPath(experience: NavExperience): string {
  return experience === 'develop-apme'
    ? '/self-service/apme/remediations'
    : '/self-service/repositories/remediations';
}

export function qualityHomePath(experience: NavExperience): string {
  return experience === 'develop-apme'
    ? '/self-service/apme'
    : '/self-service/repositories/list';
}

/** Git Repositories list — optional quality filter from Overview / Quality. */
export function repositoriesListPath(
  quality?:
    | 'recent'
    | 'scanned'
    | 'findings'
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'info',
): string {
  if (!quality) return '/self-service/repositories/list';
  return `/self-service/repositories/list?quality=${quality}`;
}

/**
 * Remediations + Scans live on a fleet surface (host tabs or Content quality pin).
 * Repo page = score summary, not a second Quality workspace.
 */
export function qualitySummaryOnRepo(experience: NavExperience): boolean {
  return experience === 'develop-apme' || experience === 'develop-tabs';
}
