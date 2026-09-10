import { type NavIaModel } from '@ansible/plugin-backstage-self-service';
import { STUDY_LANDING } from '../../studyLock';

/** Study prototype — land on Automate → Templates. */
export function modelHomePath(_model?: NavIaModel): string {
  return STUDY_LANDING;
}

export function curatedLandingPath(): string {
  return STUDY_LANDING;
}

export function mismatchedModelRedirect(
  _model: NavIaModel,
  pathname: string,
): string | null {
  if (
    pathname === '/self-service/experiences' ||
    pathname.startsWith('/self-service/experiences/') ||
    pathname === '/setup' ||
    pathname === '/self-service/setup' ||
    pathname.startsWith('/self-service/setup/') ||
    pathname.startsWith('/self-service/outcomes') ||
    pathname.startsWith('/self-service/home-dashboard') ||
    pathname === '/self-service/home' ||
    pathname.startsWith('/self-service/home/')
  ) {
    return STUDY_LANDING;
  }
  return null;
}
