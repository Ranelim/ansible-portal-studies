import { useCallback, useEffect, useState } from 'react';
import {
  readTemplatesRunsIa,
  writeTemplatesRunsIa,
  subscribeTemplatesRunsIa,
  type TemplatesRunsIaVariant,
} from './templatesRunsIa';

export function useTemplatesRunsIa() {
  const [variant, setVariantState] = useState<TemplatesRunsIaVariant>(() =>
    readTemplatesRunsIa(),
  );

  useEffect(
    () =>
      subscribeTemplatesRunsIa(() => setVariantState(readTemplatesRunsIa())),
    [],
  );

  const setVariant = useCallback((next: TemplatesRunsIaVariant) => {
    writeTemplatesRunsIa(next);
    setVariantState(next);
  }, []);

  return { variant, setVariant };
}
