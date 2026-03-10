import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { Subscription } from '../types/subscription.types';

/**
 * Hook to read user subscription row.
 * Credit balance / gate logic is in src/lib/creditGate.ts + useCreditStatus.ts.
 */
export function useSubscription(userId?: string) {
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
        if (error.code === 'PGRST116') return null; // no row yet — fine
        throw error;
      }

      return data as Subscription;
    },
    enabled: !!userId
  });

  const plan = subscription?.plan ?? 'free';
  const isPro = plan !== 'free' && subscription?.status === 'active';

  return {
    subscription,
    isLoading,
    error,
    plan,
    isPro,
    isFree: plan === 'free',
  };
}
