import { useEffect, useState, useCallback } from 'react';
import {
  readAdminSyncIa,
  writeAdminSyncIa,
  subscribeAdminSyncIa,
  type AdminSyncIaVariant,
} from './adminSyncIa';

export function useAdminSyncIa() {
  const [variant, setVariantState] = useState<AdminSyncIaVariant>(() =>
    readAdminSyncIa(),
  );

  useEffect(() => subscribeAdminSyncIa(() => setVariantState(readAdminSyncIa())), []);

  const setVariant = useCallback((next: AdminSyncIaVariant) => {
    writeAdminSyncIa(next);
    setVariantState(next);
  }, []);

  return { variant, setVariant };
}
