/**
 * Temporary review mods (Ran + agent, Aug 2026).
 *
 * ROLLBACK: set `NAV_IA_REVIEW_MODS` to `false` and refresh — restores prior IA.
 *
 * Active when true:
 * - Opt 1/4 Home: "Experiences" → "Shortcuts"
 * - Opt 1/4 rail: hide global Catalog for SME
 * - Opt 3: SME lands in Automate (/create); All-bridge also shows Templates/Activity
 */
export const NAV_IA_REVIEW_MODS = true;

export function isSmeRole(role: string): boolean {
  return role === 'sme';
}
