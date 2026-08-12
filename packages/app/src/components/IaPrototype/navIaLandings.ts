import {
  type NavIaModel,
} from '@ansible/plugin-backstage-self-service';

function readSeatRole(): string {
  try {
    // Match useUserRole prototype default when no override is set
    return localStorage.getItem('portal-user-role') || 'admin';
  } catch {
    return 'admin';
  }
}

/** Experiences shell: SME → Automate; multi-experience → Bridge catalog. */
export function modelHomePath(_model?: NavIaModel): string {
  if (readSeatRole() === 'sme') {
    return '/create';
  }
  return '/self-service/experiences';
}

/** Seat-aware fallback used by RoleLandingRedirect for operator plugins. */
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

/**
 * Experiences shell — leave bakeoff-only surfaces; SME never stays on Bridge.
 */
export function mismatchedModelRedirect(
  _model: NavIaModel,
  pathname: string,
): string | null {
  const onBridge = pathname.startsWith('/self-service/experiences');
  const onFlatHome =
    pathname === '/self-service/home' ||
    pathname.startsWith('/self-service/home/');
  const onOutcomes = pathname.startsWith('/self-service/outcomes');
  const onHomeDashboard = pathname.startsWith('/self-service/home-dashboard');
  const sme = readSeatRole() === 'sme';

  if (sme && onBridge) {
    return '/create';
  }
  if (onFlatHome || onOutcomes || onHomeDashboard) {
    return modelHomePath();
  }
  return null;
}
