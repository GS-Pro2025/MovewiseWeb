import { createContext, useContext, useState, useCallback, FC, ReactNode } from 'react';

interface OperatorsAlertContextType {
  missingSalaryCount: number;
  setMissingSalaryCount: (count: number) => void;
}

const OperatorsAlertContext = createContext<OperatorsAlertContextType>({
  missingSalaryCount: 0,
  setMissingSalaryCount: () => {},
});

export const OperatorsAlertProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [missingSalaryCount, setMissingSalaryCount] = useState(0);

  const handleSet = useCallback((count: number) => {
    setMissingSalaryCount(count);
  }, []);

  return (
    <OperatorsAlertContext.Provider value={{ missingSalaryCount, setMissingSalaryCount: handleSet }}>
      {children}
    </OperatorsAlertContext.Provider>
  );
};

export const useOperatorsAlert = () => useContext(OperatorsAlertContext);