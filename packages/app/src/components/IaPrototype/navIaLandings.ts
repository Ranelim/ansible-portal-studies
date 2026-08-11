import {
  NAV_IA_REVIEW_MODS,
  type NavIaModel,
} from '@ansible/plugin-backstage-self-service';

function readSeatRole(): string {
  try {
    return localStorage.getItem('portal-user-role') || 'sme';
  } catch {
    return 'sme';
  }
}

/** Seat-aware landing for curated (Option 2). */
export function curatedLandingPath(): string {
  let role = 'sme';
  let compliance = false;
  let rhem = false;
  try {
    role = localStorage.getItem('portal-user-role') || 'sme';
    const plugins = JSON.parse(
      localStorage.getItem('portal-nav-plugins') || '{}',
    );
    compliance = Boolean(plugins.compliance);
    rhem = Boolean(plugins.rhem);
  } catch {
    /* ignore */
  }
  if (role === 'developer' || role === 'admin') {
    return '/self-service/repositories';
  }
  if (role === 'operator') {
    if (compliance) return '/self-service/inventories';
    if (rhem) return '/self-service/edge-fleets';
  }
  return '/create';
}

export function modelHomePath(model: NavIaModel): string {
  // Opt 2 + Opt 4 share seat-aware curated landings
  if (model === 'curated' || model === 'hybrid') return curatedLandingPath();
  if (model === 'flat') return '/self-service/home';
  if (model === 'experiences') {
    // Review mod: SME lands in Automate (Templates), not All-bridge
    if (NAV_IA_REVIEW_MODS && readSeatRole() === 'sme') {
      return '/create';
    }
    return '/self-service/experiences';
  }
  return curatedLandingPath();
}

/** Pages that belong to only one IA model — redirect if the active model differs. */
export function mismatchedModelRedirect(
  model: NavIaModel,
  pathname: string,
): string | null {
  const onBridge = pathname.startsWith('/self-service/experiences');
  const onFlatHome = pathname.startsWith('/self-service/home');
  const onFlatCatalog = pathname.startsWith('/self-service/resources');

  // Opt 2 + Opt 4 — job-band rail; leave flat Home / Catalog / Experiences bridge
  if (
    (model === 'curated' || model === 'hybrid') &&
    (onBridge || onFlatHome || onFlatCatalog)
  ) {
    return curatedLandingPath();
  }
  if (model === 'flat' && onBridge) {
    return '/self-service/home';
  }
  if (model === 'experiences' && onFlatHome) {
    return '/self-service/experiences';
  }
  return null;
}
