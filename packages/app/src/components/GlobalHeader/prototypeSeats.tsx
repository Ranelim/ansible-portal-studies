import { useEffect, useState, type ReactNode } from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BuildIcon from '@mui/icons-material/Build';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import RouterIcon from '@mui/icons-material/Router';
import {
  writeNavPlugins,
  type UserRole,
  type NavPluginsState,
} from '@ansible/plugin-backstage-self-service';

export const SEAT_STORAGE_KEY = 'portal-nav-seat';

export type SeatOption = {
  id: string;
  role: UserRole;
  label: string;
  icon: ReactNode;
  plugins: NavPluginsState;
};

export const SEAT_OPTIONS: SeatOption[] = [
  {
    id: 'sme',
    role: 'sme',
    label: 'SME',
    icon: <PersonOutlineIcon fontSize="small" />,
    plugins: { apme: false, compliance: false, rhem: false },
  },
  {
    id: 'developer',
    role: 'developer',
    label: 'Developer',
    icon: <BuildIcon fontSize="small" />,
    plugins: { apme: true, compliance: false, rhem: false },
  },
  {
    id: 'compliance-ops',
    role: 'operator',
    label: 'Compliance ops',
    icon: <StorageIcon fontSize="small" />,
    plugins: { apme: false, compliance: true, rhem: false },
  },
  {
    id: 'edge-ops',
    role: 'operator',
    label: 'Edge ops',
    icon: <RouterIcon fontSize="small" />,
    plugins: { apme: false, compliance: false, rhem: true },
  },
  {
    id: 'ops-both',
    role: 'operator',
    label: 'Ops (both plugins)',
    icon: <SecurityIcon fontSize="small" />,
    plugins: { apme: false, compliance: true, rhem: true },
  },
  {
    id: 'admin',
    role: 'admin',
    label: 'Admin',
    icon: <SupervisorAccountIcon fontSize="small" />,
    plugins: { apme: true, compliance: true, rhem: true },
  },
];

const SEAT_MIGRATIONS: Record<string, string> = {
  'edge-ops-2': 'edge-ops',
  'ops-sprawl': 'ops-both',
};

/** Sync seat ↔ plugins once; migrate removed anti-pattern seats. */
export function usePrototypeSeatSync(): string {
  const [seatId, setSeatId] = useState('admin');

  useEffect(() => {
    try {
      let id = localStorage.getItem(SEAT_STORAGE_KEY) || 'admin';
      let needsReload = false;
      const rawPlugins = localStorage.getItem('portal-nav-plugins');
      if (
        rawPlugins &&
        (rawPlugins.includes('rhemDevices') || rawPlugins.includes('navSprawl'))
      ) {
        needsReload = true;
      }
      if (SEAT_MIGRATIONS[id]) {
        id = SEAT_MIGRATIONS[id];
        localStorage.setItem(SEAT_STORAGE_KEY, id);
        needsReload = true;
      }
      const seat =
        SEAT_OPTIONS.find(s => s.id === id) ??
        SEAT_OPTIONS.find(s => s.id === 'admin');
      if (seat) {
        localStorage.setItem('portal-user-role', seat.role);
        writeNavPlugins(seat.plugins);
        setSeatId(seat.id);
      }
      if (needsReload && !sessionStorage.getItem('portal-nav-seat-migrated')) {
        sessionStorage.setItem('portal-nav-seat-migrated', '1');
        window.location.reload();
      }
    } catch {
      /* ignore */
    }
  }, []);

  return seatId;
}

export function applySeat(seat: SeatOption) {
  localStorage.setItem('portal-user-role', seat.role);
  localStorage.setItem(SEAT_STORAGE_KEY, seat.id);
  writeNavPlugins(seat.plugins);
  window.location.reload();
}
