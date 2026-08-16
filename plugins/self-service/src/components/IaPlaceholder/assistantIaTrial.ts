/**
 * Assistant side-nav IA trial (Experiences shell exploration).
 *
 * ROLLBACK: set `ASSISTANT_SIDE_NAV_TRIAL` to `false` and hard-refresh.
 * That restores rail-less Assistant + page-header Back (pre-trial).
 *
 * Trial adds: experience-style rail (return, New chat, history, clear)
 * and removes the in-page title/Back row.
 */
export const ASSISTANT_SIDE_NAV_TRIAL = true;

export function isAssistantPath(pathname: string): boolean {
  return (
    pathname === '/self-service/assistant' ||
    pathname.startsWith('/self-service/assistant/')
  );
}

/** True when Assistant should use SidebarPage + Assistant rail. */
export function assistantUsesSideNav(pathname?: string): boolean {
  if (!ASSISTANT_SIDE_NAV_TRIAL) return false;
  if (pathname === undefined) return true;
  return isAssistantPath(pathname);
}
