import { supabase } from './supabase';

// Profile operations
export const profileOperations = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  searchProfiles: async (query: string, limit = 10) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url, is_verified')
      .or(`username.ilike.%${query}%, first_name.ilike.%${query}%, last_name.ilike.%${query}%`)
      .limit(limit);
    
    return { data, error };
  },

  checkUsernameAvailability: async (username: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();
    
    // If error code is PGRST116, it means no rows found (username available)
    if (error && error.code === 'PGRST116') {
      return { available: true, error: null };
    } else if (data) {
      return { available: false, error: null };
    } else {
      return { available: null, error };
    }
  }
};

// Follow operations
export const followOperations = {
  followUser: async (followingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId
      })
      .select()
      .single();
    
    return { data, error };
  },

  unfollowUser: async (followingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);
    
    return { error };
  },

  getFollowers: async (userId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        created_at,
        profiles!follows_follower_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  getFollowing: async (userId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        profiles!follows_following_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  isFollowing: async (followingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isFollowing: false, error: null };

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();
    
    return { 
      isFollowing: !!data, 
      error: error && error.code !== 'PGRST116' ? error : null 
    };
  }
};

// Real-time subscriptions
export const subscriptions = {
  subscribeToProfile: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  subscribeToFollows: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`follows-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};