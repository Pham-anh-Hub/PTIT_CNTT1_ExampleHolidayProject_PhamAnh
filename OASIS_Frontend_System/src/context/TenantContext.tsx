import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '../types';
import { SAMPLE_TENANTS } from '../data';

type TenantContextProps = {
  currentTenant: Tenant | null;
  setCurrentTenant: React.Dispatch<React.SetStateAction<Tenant | null>>;
};

export const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('saas_user');
    if (saved) {
      const user = JSON.parse(saved) as any; // User type defined elsewhere
      const found = SAMPLE_TENANTS.find((t) => t.id === user.tenantId);
      if (found) setCurrentTenant(found);
    }
    if (!currentTenant && SAMPLE_TENANTS.length > 0) {
      setCurrentTenant(SAMPLE_TENANTS[0]);
    }
  }, []);

  return (
    <TenantContext.Provider value={{ currentTenant, setCurrentTenant }}>
      {children}
    </TenantContext.Provider>
  );
};
