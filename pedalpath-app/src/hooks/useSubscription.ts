import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { Subscription, UsageCheck } from '../types/subscription.types';

/**
 * Hook to manage user subscription
 */
export function useSubscription(userId?: string) {
  const queryClient = useQueryClient();

  // Fetch subscription data
  const {
    data: subscription,
    isLoading,
    error
  } = useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no subscription exists, create free tier
        if (error.code === 'PGRST116') {
          const { data: newSub, error: createError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan: 'free',
              status: 'active',
              schematics_limit: 1,
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (createError) throw createError;
          return newSub as Subscription;
        }
        throw error;
      }

      return data as Subscription;
    },
    enabled: !!userId
  });

  // Check if user can upload
  const checkUsage = async (): Promise<UsageCheck> => {
    if (!userId) {
      return { allowed: false, reason: 'not_authenticated', schematics_remaining: 0 };
    }

    const { data, error } = await supabase
      .rpc('can_user_upload', { p_user_id: userId });

    if (error) throw error;
    return data[0] as UsageCheck;
  };

  // Increment usage after successful upload
  const incrementUsage = useMutation({
    mutationFn: async (schematicId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .rpc('increment_usage', {
          p_user_id: userId,
          p_schematic_id: schematicId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate subscription query to refetch updated usage
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    }
  });

  // Update subscription (called by webhook)
  const updateSubscription = useMutation({
    mutationFn: async (updates: Partial<Subscription>) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    }
  });

  // Helper functions
  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  const isFree = subscription?.plan === 'free';
  const hasUploadsRemaining = isFree
    ? (subscription?.schematics_used_this_month || 0) < (subscription?.schematics_limit || 1)
    : true; // Pro users always have uploads

  const uploadsRemaining = isPro
    ? 999999 // Unlimited
    : Math.max(0, (subscription?.schematics_limit || 1) - (subscription?.schematics_used_this_month || 0));

  return {
    subscription,
    isLoading,
    error,
    isPro,
    isFree,
    hasUploadsRemaining,
    uploadsRemaining,
    checkUsage,
    incrementUsage: incrementUsage.mutate,
    updateSubscription: updateSubscription.mutate,
    isIncrementingUsage: incrementUsage.isPending
  };
}
