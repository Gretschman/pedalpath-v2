import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export type SchematicStatus = 'processing' | 'completed' | 'failed' | 'error';

export interface SchematicStatusResult {
  status: SchematicStatus;
  schematicId: string;
}

/**
 * Subscribes to Supabase Realtime for a specific schematic's processing_status.
 * Immediately checks current DB status, then listens for UPDATE events.
 * The schematics.processing_status column values: 'pending' | 'processing' | 'completed' | 'failed'
 */
export function useSchematicStatus(schematicId: string | null): SchematicStatusResult {
  const [status, setStatus] = useState<SchematicStatus>('processing');

  useEffect(() => {
    if (!schematicId) return;

    // Check current status immediately (handles page refresh after analysis completes)
    supabase
      .from('schematics')
      .select('processing_status')
      .eq('id', schematicId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const s = data.processing_status as string;
        if (s === 'completed') setStatus('completed');
        else if (s === 'failed') setStatus('failed');
      });

    // Subscribe to Realtime UPDATE events for this schematic row
    const channel = supabase
      .channel(`schematic:${schematicId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'schematics',
          filter: `id=eq.${schematicId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          const s = updated['processing_status'] as string | undefined;
          if (s === 'completed') setStatus('completed');
          else if (s === 'failed') setStatus('failed');
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schematicId]);

  return { status, schematicId: schematicId ?? '' };
}
