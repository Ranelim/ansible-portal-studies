import { STUDY_DISPLAY_NAME } from '../../studyLock';

/**
 * Study prototype identity chip — always "Username".
 */
export function prototypeDisplayName(
  _raw?: string | null,
  _seatId?: string | null,
): string {
  return STUDY_DISPLAY_NAME;
}
