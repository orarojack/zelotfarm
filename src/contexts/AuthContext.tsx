import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // First, try to fetch user with custom role join
      // If this fails (e.g., custom_roles table doesn't exist), fall back to simple query
      let data: any = null;
      let error: any = null;

      try {
        const result = await supabase
          .from('users')
          .select(`
            *,
            custom_roles (
              id,
              name,
              description
            )
          `)
          .eq('id', userId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      } catch (joinError) {
        // If join fails (table doesn't exist or RLS issue), try simple query
        console.log('Custom roles join failed, trying simple query:', joinError);
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        // If it's a "not found" error, that's okay - record might not exist yet
        if (error.code === 'PGRST116') {
          console.log('User record not found in users table');
          setUser(null);
        } else {
          // For other errors, log but don't throw - allow fallback
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else if (data) {
        // If user has a custom role, use that role name; otherwise use default role
        const effectiveRole = data?.custom_roles?.name || data?.role;
        setUser({
          ...data,
          role: effectiveRole,
        } as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide more helpful error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before signing in.');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('Failed to sign in. Please try again.');
    }

    // Fetch user data and wait for it to complete
    await fetchUserData(data.user.id);
    
    // Check if user record was found
    // Note: fetchUserData sets loading to false, so we need to check after it completes
    // The user state will be updated by fetchUserData
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

