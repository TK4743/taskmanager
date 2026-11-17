import React, { createContext, useContext } from 'react';

interface NavigationContextType {
  view: string;
  setView: (view: string) => void;
  publicPortfolioRegNo: string | null;
  setPublicPortfolioRegNo: (regNo: string | null) => void;
  viewingStudentProfileId: string | null;
  setViewingStudentProfileId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{
  value: NavigationContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
