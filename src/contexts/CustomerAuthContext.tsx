import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface CustomerAuthContextType {
  customer: Customer | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchCustomerData(session.user.id);
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
        fetchCustomerData(session.user.id);
      } else {
        setCustomer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCustomerData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // If it's a "not found" error, that's okay - record might not exist yet
        if (error.code === 'PGRST116') {
          console.log('Customer record not found, will be created on next action');
          setCustomer(null);
        } else {
          throw error;
        }
      } else {
        setCustomer(data);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (authError) {
      // Provide more helpful error messages
      if (authError.message.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    // Create customer record
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        phone,
      });

    if (customerError) {
      // If customer creation fails but user exists, try to fetch anyway
      console.error('Error creating customer record:', customerError);
      // Don't throw - user might already exist
      if (!customerError.message.includes('duplicate') && !customerError.message.includes('unique')) {
        throw new Error('Account created but profile setup failed. Please contact support.');
      }
    }

    // If email confirmation is required, user won't be able to sign in immediately
    // Check if user is confirmed
    if (authData.user && !authData.session) {
      // Email confirmation required
      throw new Error('Please check your email to confirm your account before signing in.');
    }

    // If session exists (email confirmation disabled), fetch customer data
    if (authData.session) {
      await fetchCustomerData(authData.user.id);
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
      if (error.message.includes('too many requests')) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw error;
    }

    if (data.user) {
      // Check if customer record exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      
      // If customer record doesn't exist, create it
      if (!existingCustomer) {
        try {
          const { error: createError } = await supabase
            .from('customers')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || 'Customer',
            });
          
          if (createError) {
            console.error('Error creating customer record:', createError);
            // Don't throw - user can still proceed
          }
        } catch (err) {
          console.error('Error creating customer record:', err);
          // Don't throw - user can still proceed
        }
      }
      
      // Fetch customer data (will get the newly created record if it was just created)
      await fetchCustomerData(data.user.id);
    } else {
      throw new Error('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCustomer(null);
    setSupabaseUser(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        supabaseUser,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}

