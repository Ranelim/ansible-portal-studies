/**
 * Day 0 onboarding wizard only (`/setup`, `/self-service/setup`).
 * Do not treat Administration experience setup (`.../experiences/:id/setup`) as Day 0.
 */
export function isDay0SetupPath(pathname: string): boolean {
  return (
    pathname === '/setup' ||
    pathname === '/self-service/setup' ||
    pathname.startsWith('/self-service/setup/')
  );
}
