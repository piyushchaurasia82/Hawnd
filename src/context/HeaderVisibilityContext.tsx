import React, { createContext, useState, useContext } from 'react';

interface HeaderVisibilityContextType {
  headerHidden: boolean;
  setHeaderHidden: (hidden: boolean) => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityContextType | undefined>(undefined);

export const HeaderVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [headerHidden, setHeaderHidden] = useState(false);
  return (
    <HeaderVisibilityContext.Provider value={{ headerHidden, setHeaderHidden }}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
};

export const useHeaderVisibility = () => {
  const context = useContext(HeaderVisibilityContext);
  if (!context) {
    throw new Error('useHeaderVisibility must be used within a HeaderVisibilityProvider');
  }
  return context;
};

export { HeaderVisibilityContext }; 