import { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';

type RestartState = {
  restartRequired: boolean;
  setRestartRequired: (v: boolean) => void;
};

const RestartContext = createContext<RestartState>({
  restartRequired: false,
  setRestartRequired: () => {},
});

export const useRestartRequired = () => useContext(RestartContext);

export const RestartProvider = ({ children }: PropsWithChildren<{}>) => {
  const [restartRequired, setRestartRequiredRaw] = useState(false);
  const setRestartRequired = useCallback((v: boolean) => setRestartRequiredRaw(v), []);

  return (
    <RestartContext.Provider value={{ restartRequired, setRestartRequired }}>
      {children}
    </RestartContext.Provider>
  );
};
