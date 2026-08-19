import type { NavExperience } from '../../../hooks/useNavIaModel';
import {
  APME_CATEGORY_ORDER,
  type ApmeRuleCategory,
} from '../detail/qualityDemoData';

/** Fleet Quality / Remediations / Scans — Git Repositories nested rail. */
export function scansListPath(_experience: NavExperience): string {
  return '/self-service/repositories/scans';
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

export function remediationsListPath(_experience: NavExperience): string {
  return '/self-service/repositories/remediations';
}

export function qualityHomePath(_experience: NavExperience): string {
  return '/self-service/repositories/dashboard';
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

/** Repo page = score summary. Remediations / Scans live on the Git Repositories rail. */
export function qualitySummaryOnRepo(_experience: NavExperience): boolean {
  return true;
}
