import { SEAT_OPTIONS, SEAT_STORAGE_KEY } from './prototypeSeats';

/**
 * Prototype identity chip.
 * Guest / local sign-in has no real person — show the demo seat label.
 * Production masthead uses the signed-in user's display name, not a role.
 */
function readStoredSeatId(): string {
  try {
    return localStorage.getItem(SEAT_STORAGE_KEY) || 'admin';
  } catch {
    return 'admin';
  }
}

export function prototypeDisplayName(
  raw?: string | null,
  seatId?: string | null,
): string {
  const id = (seatId && seatId.trim()) || readStoredSeatId();
  const seatLabel = SEAT_OPTIONS.find(s => s.id === id)?.label;
  if (seatLabel) return seatLabel;

  const name = (raw || '').trim();
  if (!name || /^guest(\s+user)?$/i.test(name)) return 'Admin';
  return name;
}
