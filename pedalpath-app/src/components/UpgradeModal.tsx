import { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

export function UpgradeModal({ isOpen, onClose, userId, userEmail }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const priceId = import.meta.env.VITE_STRIPE_PRO_PRICE_ID;
      if (!priceId) throw new Error('Stripe price ID not configured');

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId,
          userEmail,
          planType: 'subscription',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 px-6 pt-8 pb-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-400 rounded-full p-2">
              <Zap className="w-5 h-5 text-gray-900" />
            </div>
            <span className="font-bold text-lg">Upgrade to Pro</span>
          </div>
          <h2 className="text-2xl font-black leading-tight mb-1">
            You've used your free schematic this month
          </h2>
          <p className="text-white/75 text-sm">
            Upgrade to Pro for unlimited schematics and the full build experience.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-black text-gray-900">$9</span>
            <span className="text-gray-500 text-sm">/month</span>
          </div>

          <ul className="space-y-2 mb-6">
            {[
              'Unlimited schematic uploads',
              'Full BOM generation with editing',
              'Complete step-by-step build guides',
              'Save unlimited projects',
              'Priority support',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 transition text-base"
          >
            {loading ? 'Redirecting to checkout…' : 'Upgrade to Pro — $9/month'}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            7-day free trial · Cancel anytime · Secure payments by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
