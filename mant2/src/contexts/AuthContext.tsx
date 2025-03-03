import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, clearAuthState } from '../lib/supabase';
import type { UserProfile } from '../types';
import { uploadProfilePicture } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { withTimeout, TimeoutError, SUPABASE_TIMEOUT } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string) => Promise<{ error?: string }>;
  completeProfile: (profileData: {
    username: string;
    age: number;
    interestGenres: string[];
    bio: string;
    profilePicture: File | null;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  needsProfileCompletion: boolean;
  refreshUserProfile: () => Promise<{ data: UserProfile | null; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializeAuth = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!mounted) return;

        if (session.data.session?.user) {
          setUser(session.data.session.user);
          await fetchUserProfile(session.data.session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(initializeAuth, 2000 * retryCount); // Exponential backoff
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setNeedsProfileCompletion(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
      if (data?.username) {
        setNeedsProfileCompletion(false);
      } else {
        setNeedsProfileCompletion(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Don't show error toast here as it's not critical for the user experience
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
        }),
        SUPABASE_TIMEOUT,
        'Registration'
      );

      if (error) throw error;
      
      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchUserProfile(data.user.id);
        toast.success('Registration successful!');
        return {};
      }
      
      throw new Error('Registration failed');
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error instanceof TimeoutError
        ? 'Registration timed out. Please try again.'
        : error.message || 'Registration failed';
      toast.error(message);
      return { error: message };
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        SUPABASE_TIMEOUT,
        'Login'
      );
      
      if (error) throw error;
      
      if (data.user) {
        await fetchUserProfile(data.user.id);
        toast.success('Login successful!');
        navigate('/');
        return {};
      }

      throw new Error('Login failed');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error instanceof TimeoutError
        ? 'Login timed out. Please try again.'
        : error.message || 'Login failed';
      toast.error(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await withTimeout(
        clearAuthState(),
        SUPABASE_TIMEOUT,
        'Logout'
      );
      setUser(null);
      setUserProfile(null);
      setNeedsProfileCompletion(false);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      const message = error instanceof TimeoutError
        ? 'Logout timed out. Please try again.'
        : error.message || 'Failed to logout';
      toast.error(message);
      throw error;
    }
  };

  const completeProfile = async (profileData: {
    username: string;
    age: number;
    interestGenres: string[];
    bio: string;
    profilePicture: File | null;
  }) => {
    if (!user) return { error: 'No user found' };

    try {
      let profilePictureUrl = null;
      if (profileData.profilePicture) {
        profilePictureUrl = await withTimeout(
          uploadProfilePicture(profileData.profilePicture),
          SUPABASE_TIMEOUT,
          'Profile picture upload'
        );
      }

      const { error: updateError } = await withTimeout(
        supabase
          .from('Users')
          .update({
            username: profileData.username,
            age: profileData.age,
            interest_genre: profileData.interestGenres,
            bio: profileData.bio,
            profile_picture: profilePictureUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id),
        SUPABASE_TIMEOUT,
        'Profile update'
      );

      if (updateError) throw updateError;

      await fetchUserProfile(user.id);
      toast.success('Profile updated successfully!');
      return {};
    } catch (error: any) {
      console.error('Error completing profile:', error);
      const message = error instanceof TimeoutError
        ? 'Profile update timed out. Please try again.'
        : error.message || 'Failed to update profile';
      toast.error(message);
      return { error: message };
    }
  };

  const refreshUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('Users')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setUserProfile(data);
        return { data, error: null };
      }
      return { data: null, error: null };
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    userProfile,
    login,
    register,
    completeProfile,
    logout,
    loading,
    needsProfileCompletion,
    refreshUserProfile
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}