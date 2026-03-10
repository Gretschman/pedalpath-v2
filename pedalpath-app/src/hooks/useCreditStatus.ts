import { useEffect, useState } from 'react';
import { getCreditStatus, type CreditStatus } from '../lib/creditGate';

export function useCreditStatus(userId: string | undefined) {
  const [status, setStatus] = useState<CreditStatus | null>(null);

  useEffect(() => {
    if (!userId) { setStatus(null); return; }
    getCreditStatus(userId).then(setStatus);
  }, [userId]);

  return status;
}
