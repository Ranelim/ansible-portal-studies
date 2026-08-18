import type { NavExperience } from '../../../hooks/useNavIaModel';

/** Content quality pin vs Git Repositories host tabs / drawer. */
export function scansListPath(experience: NavExperience): string {
  return experience === 'develop-apme'
    ? '/self-service/apme/scans'
    : '/self-service/repositories/scans';
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

/**
 * Remediations + Scans live on a fleet surface (host tabs or Content quality pin).
 * Repo page = score summary, not a second Quality workspace.
 */
export function qualitySummaryOnRepo(experience: NavExperience): boolean {
  return experience === 'develop-apme' || experience === 'develop-tabs';
}
