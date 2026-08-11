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

/** Option 3 (homeband) — multi-band → Home Dashboard; SME → Templates (like Opt 2). */
export function homeBandLandingPath(): string {
  const role = readSeatRole();
  if (role === 'sme') return '/create';
  // Non-default bands on → Dashboard is in the Home section
  if (role === 'developer' || role === 'admin' || role === 'operator') {
    return '/self-service/home-dashboard';
  }
  return curatedLandingPath();
}

export function modelHomePath(model: NavIaModel): string {
  // Opt 2 + Opt 4 (hybrid) share seat-aware curated landings
  if (model === 'curated' || model === 'hybrid') return curatedLandingPath();
  if (model === 'homeband') return homeBandLandingPath();
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
  const onFlatHome =
    pathname === '/self-service/home' ||
    pathname.startsWith('/self-service/home/');
  const onFlatCatalog = pathname.startsWith('/self-service/resources');
  const onOutcomes = pathname.startsWith('/self-service/outcomes');
  const onHomeDashboard = pathname.startsWith('/self-service/home-dashboard');

  // Opt 2 — allow Home pin; leave Catalog / Experiences / Opt4-only surfaces
  if (
    model === 'curated' &&
    (onBridge || onFlatCatalog || onOutcomes || onHomeDashboard)
  ) {
    return curatedLandingPath();
  }
  // Opt 4 (hybrid) — no Home pin; allow gated Dashboard; leave flat Home /
  // Catalog / Experiences / Outcomes
  if (
    model === 'hybrid' &&
    (onBridge || onFlatHome || onFlatCatalog || onOutcomes)
  ) {
    return curatedLandingPath();
  }
  // Opt 3 (homeband) — allow Home Dashboard; leave Outcomes / Opt 1 Home /
  // Catalog / Experiences
  if (
    model === 'homeband' &&
    (onBridge || onFlatHome || onFlatCatalog || onOutcomes)
  ) {
    return homeBandLandingPath();
  }
  if (model === 'flat' && (onBridge || onOutcomes || onHomeDashboard)) {
    return '/self-service/home';
  }
  if (model === 'experiences' && (onFlatHome || onOutcomes || onHomeDashboard)) {
    return '/self-service/experiences';
  }
  return null;
}
