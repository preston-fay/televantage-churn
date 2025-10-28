import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppState, GlobalAssumptions, AppData } from '@/types';
import { loadAllData } from '@/utils/dataLoaders';

// Default global assumptions
const defaultAssumptions: GlobalAssumptions = {
  arpu: 65, // $65/month
  ltv_months: 36, // 36 months
  gross_margin: 0.45, // 45%
  save_rate: 0.30, // 30%
  discount_rate: 0.10, // 10%
};

interface AppContextType extends AppState {
  setAssumptions: (assumptions: GlobalAssumptions) => void;
  updateAssumption: (key: keyof GlobalAssumptions, value: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [assumptions, setAssumptions] = useState<GlobalAssumptions>(defaultAssumptions);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const appData = await loadAllData();
        setData(appData);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const updateAssumption = (key: keyof GlobalAssumptions, value: number) => {
    setAssumptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const value: AppContextType = {
    data,
    assumptions,
    isLoading,
    error,
    setAssumptions,
    updateAssumption,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
