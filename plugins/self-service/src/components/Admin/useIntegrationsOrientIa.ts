import { useEffect, useState, useCallback } from 'react';
import {
  readIntegrationsOrient,
  writeIntegrationsOrient,
  subscribeIntegrationsOrient,
  type IntegrationsOrientVariant,
} from './integrationsOrientIa';

export function useIntegrationsOrientIa() {
  const [variant, setVariantState] = useState<IntegrationsOrientVariant>(() =>
    readIntegrationsOrient(),
  );

  useEffect(
    () =>
      subscribeIntegrationsOrient(() =>
        setVariantState(readIntegrationsOrient()),
      ),
    [],
  );

  const setVariant = useCallback((next: IntegrationsOrientVariant) => {
    writeIntegrationsOrient(next);
    setVariantState(next);
  }, []);

  return { variant, setVariant };
}
