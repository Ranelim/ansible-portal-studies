import type { NavIaModel } from '@ansible/plugin-backstage-self-service';

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
  if (model === 'flat') return '/self-service/home';
  if (model === 'experiences') return '/self-service/experiences';
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

  if (model === 'curated' && (onBridge || onFlatHome || onFlatCatalog)) {
    return curatedLandingPath();
  }
  if (model === 'flat' && onBridge) {
    return '/self-service/home';
  }
  if (model === 'experiences' && (onFlatHome || onFlatCatalog)) {
    return '/self-service/experiences';
  }
  return null;
}
