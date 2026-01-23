import React, { createContext, useContext, ReactNode } from 'react';
import { useConnection, type ConnectionState } from '@/hooks/useConnection';

interface ConnectionContextType extends ConnectionState {
  reconnect: () => void;
  checkConnection: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

interface ConnectionProviderProps {
  children: ReactNode;
  checkInterval?: number;
}

export function ConnectionProvider({ children, checkInterval = 30000 }: ConnectionProviderProps) {
  const connection = useConnection({ checkInterval, enabled: true });
  
  return (
    <ConnectionContext.Provider value={connection}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionContext() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider');
  }
  return context;
}

// Export types
export type { ConnectionContextType };
