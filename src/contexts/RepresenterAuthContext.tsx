import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';

interface RepresenterAuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const RepresenterAuthContext = createContext<RepresenterAuthContextType | undefined>(undefined);

export function RepresenterAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('representer_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (password: string) => {
    // First check if it's the master code
    const masterPassword = import.meta.env.VITE_REPRESENTER_ACCESS_CODE;
    if (password === masterPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('representer_authenticated', 'true');
      return { success: true };
    }

    // Check if it's a one-time code from database
    try {
      const { data, error } = await supabase
        .from('representer_codes')
        .select('*')
        .eq('code', password)
        .eq('used', false)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid or already used code' };
      }

      // Mark code as used
      const { error: updateError } = await supabase
        .from('representer_codes')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) {
        return { success: false, error: 'Error validating code' };
      }

      setIsAuthenticated(true);
      sessionStorage.setItem('representer_authenticated', 'true');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error checking code' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('representer_authenticated');
  };

  return (
    <RepresenterAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </RepresenterAuthContext.Provider>
  );
}

export function useRepresenterAuth() {
  const context = useContext(RepresenterAuthContext);
  if (!context) {
    throw new Error('useRepresenterAuth must be used within RepresenterAuthProvider');
  }
  return context;
}
