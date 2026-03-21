import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, handleFetchError } from './supabase';
import { UserProfile } from './types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(session ? true : false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
        setLoading(false);
      } else {
        setLoading(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch profile
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        handleFetchError(error);
        console.error("Error fetching profile:", error);
        // If profile doesn't exist (common for first-time Google login), create it
        if (error.code === 'PGRST116' || (error as any).message?.includes('JSON object requested, but 0 rows were returned')) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
                role: user.email === 'paulttechh@gmail.com' ? 'admin' : (user.user_metadata?.role || 'client'),
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile for new user:", createError);
          } else if (newProfile) {
            setProfile(newProfile as UserProfile);
          }
        }
      } else if (data) {
        const profileData = data as UserProfile;
        // Force admin role for the specific email if it's not already set
        if (user.email === 'paulttechh@gmail.com' && profileData.role !== 'admin') {
          console.log("Forcing admin role for", user.email);
          profileData.role = 'admin';
          // Update in database to persist
          supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
            .then(({ error }) => {
              if (error) console.error("Error updating admin role in DB:", error);
            });
        }
        setProfile(profileData);
      } else {
        // No profile found and no error? Should not happen with .single() but just in case
        if (user.email === 'paulttechh@gmail.com') {
          setProfile({
            id: user.id,
            email: user.email,
            name: 'Administrador',
            role: 'admin',
            created_at: new Date().toISOString()
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
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
