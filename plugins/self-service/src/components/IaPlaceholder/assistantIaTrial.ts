/**
 * Assistant experience (Bridge card + `/self-service/assistant`).
 *
 * Killed for this prototype pass — Lightspeed masthead drawer remains.
 * Set `SHOW_ASSISTANT_EXPERIENCE` to `true` to revive the card, route, and rail.
 *
 * Side-nav trial (only when the experience is on):
 * ROLLBACK: set `ASSISTANT_SIDE_NAV_TRIAL` to `false` → rail-less + page-header Back.
 */
export const SHOW_ASSISTANT_EXPERIENCE = false;

export const ASSISTANT_SIDE_NAV_TRIAL = true;

export function isAssistantPath(pathname: string): boolean {
  return (
    pathname === '/self-service/assistant' ||
    pathname.startsWith('/self-service/assistant/')
  );
}

/** True when Assistant should use SidebarPage + Assistant rail. */
export function assistantUsesSideNav(pathname?: string): boolean {
  if (!SHOW_ASSISTANT_EXPERIENCE) return false;
  if (!ASSISTANT_SIDE_NAV_TRIAL) return false;
  if (pathname === undefined) return true;
  return isAssistantPath(pathname);
}
