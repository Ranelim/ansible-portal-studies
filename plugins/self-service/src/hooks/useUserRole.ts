import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { parseEntityRef } from '@backstage/catalog-model';

export type UserRole = 'sme' | 'developer' | 'operator' | 'admin';

const ROLE_ANNOTATION = 'ansible.portal/role';
const CACHE_TTL_MS = 5 * 60 * 1000;

const ROLE_HIERARCHY: Record<UserRole, number> = {
  sme: 0,
  developer: 1,
  operator: 1,
  admin: 2,
};

interface RoleCache {
  role: UserRole;
  timestamp: number;
  userRef: string | null;
}

let roleCache: RoleCache | null = null;

function isCacheValid(userRef: string | undefined): boolean {
  return (
    roleCache !== null &&
    roleCache.userRef === userRef &&
    Date.now() - roleCache.timestamp < CACHE_TTL_MS
  );
}

export interface UseUserRoleResult {
  role: UserRole;
  loading: boolean;
  /** True if user's role is at least the given minimum */
  hasRole: (minRole: UserRole) => boolean;
}

/**
 * Determines the user's Portal role from catalog entity annotations.
 *
 * Annotation: `ansible.portal/role` = 'sme' | 'developer' | 'admin'
 *
 * For the prototype, the role can also be toggled via localStorage
 * key `portal-user-role` to allow quick switching without entity changes.
 * localStorage takes precedence when set.
 *
 * Falls back to 'developer' when no annotation or override is present
 * (prototype default — switch to 'sme' for production).
 */
export function useUserRole(): UseUserRoleResult {
  const identityApi = useApi(identityApiRef);
  const catalogApi = useApi(catalogApiRef);

  const [role, setRole] = useState<UserRole>(() => {
    const override = localStorage.getItem('portal-user-role') as UserRole | null;
    if (override && override in ROLE_HIERARCHY) return override;
    if (roleCache && Date.now() - roleCache.timestamp < CACHE_TTL_MS) {
      return roleCache.role;
    }
    return 'admin';
  });

  const [loading, setLoading] = useState(() => {
    const override = localStorage.getItem('portal-user-role');
    if (override) return false;
    return !(roleCache && Date.now() - roleCache.timestamp < CACHE_TTL_MS);
  });

  useEffect(() => {
    let mounted = true;

    const override = localStorage.getItem('portal-user-role') as UserRole | null;
    if (override && override in ROLE_HIERARCHY) {
      setRole(override);
      setLoading(false);
      return;
    }

    const resolve = async () => {
      try {
        const identity = await identityApi.getBackstageIdentity();
        const userEntityRef = identity.userEntityRef;

        if (isCacheValid(userEntityRef) && roleCache) {
          if (mounted) {
            setRole(roleCache.role);
            setLoading(false);
          }
          return;
        }

        if (mounted) setLoading(true);

        if (!userEntityRef) {
          roleCache = { role: 'admin', timestamp: Date.now(), userRef: null };
          if (mounted) { setRole('admin'); setLoading(false); }
          return;
        }

        const { kind, namespace, name } = parseEntityRef(userEntityRef);
        const entity = await catalogApi.getEntityByRef({
          kind,
          namespace: namespace || 'default',
          name,
        });

        const annotated = entity?.metadata?.annotations?.[ROLE_ANNOTATION] as UserRole | undefined;
        const resolved = annotated && annotated in ROLE_HIERARCHY ? annotated : 'admin';

        roleCache = { role: resolved, timestamp: Date.now(), userRef: userEntityRef };
        if (mounted) { setRole(resolved); setLoading(false); }
      } catch {
        if (mounted) { setRole('developer'); setLoading(false); }
      }
    };

    resolve();
    return () => { mounted = false; };
  }, [identityApi, catalogApi]);

  const hasRole = useCallback(
    (minRole: UserRole) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole],
    [role],
  );

  return useMemo(() => ({ role, loading, hasRole }), [role, loading, hasRole]);
}

/** Context for sharing role state without redundant API calls */
export const UserRoleContext = createContext<UseUserRoleResult>({
  role: 'admin',
  loading: false,
  hasRole: () => true,
});

export const useUserRoleContext = () => useContext(UserRoleContext);

export function clearRoleCache(): void {
  roleCache = null;
}
