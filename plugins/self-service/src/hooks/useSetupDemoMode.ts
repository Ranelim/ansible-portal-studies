import { useCallback, useEffect, useState } from 'react';
import {
  bumpSetupDemoEpoch,
  readSetupDemoEpoch,
  readSetupDemoMode,
  subscribeSetupDemoMode,
  writeSetupDemoMode,
  type SetupDemoMode,
} from './setupDemoMode';

export function useSetupDemoMode() {
  const [mode, setModeState] = useState<SetupDemoMode>(() =>
    readSetupDemoMode(),
  );
  const [epoch, setEpoch] = useState(() => readSetupDemoEpoch());

  useEffect(
    () =>
      subscribeSetupDemoMode(() => {
        setModeState(readSetupDemoMode());
        setEpoch(readSetupDemoEpoch());
      }),
    [],
  );

  const setMode = useCallback((next: SetupDemoMode) => {
    writeSetupDemoMode(next);
    if (next === 'landing') {
      bumpSetupDemoEpoch();
    }
    setModeState(next);
    setEpoch(readSetupDemoEpoch());
  }, []);

  return { mode, setMode, epoch };
}
