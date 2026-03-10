import { useState } from 'react';
import { X, Zap, Coffee, Check } from 'lucide-react';
import { PRICING_PLANS, type Plan } from '../types/subscription.types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  currentPlan?: Plan;
  creditsRemaining?: number | null;
}

export function UpgradeModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  currentPlan = 'free',
  creditsRemaining = 0,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  if (!isOpen) return null;

  const upgradePlans = PRICING_PLANS.filter(p => p.id !== 'free');

  const handleSelect = async (planId: Plan) => {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: planId, userId, userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  const creditLabel =
    currentPlan === 'studio' ? '∞'
    : creditsRemaining === null ? '∞'
    : String(creditsRemaining ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
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
            <span className="font-bold text-lg">Upgrade your plan</span>
          </div>
          <h2 className="text-2xl font-black leading-tight mb-1">
            You're out of credits
          </h2>
          <p className="text-white/75 text-sm">
            Current plan: <span className="font-semibold capitalize">{currentPlan}</span>
            {' · '}
            Credits remaining: <span className="font-semibold">{creditLabel}</span>
          </p>
        </div>

        {/* Plan options */}
        <div className="px-6 py-5 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {upgradePlans.map(plan => (
            <div
              key={plan.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                plan.recommended ? 'border-green-600 bg-green-50' : 'border-gray-100'
              }`}
            >
              {plan.isCoffee ? (
                <Coffee className="w-6 h-6 text-amber-500 flex-shrink-0" />
              ) : (
                <Zap className={`w-6 h-6 flex-shrink-0 ${plan.recommended ? 'text-green-600' : 'text-gray-400'}`} />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{plan.name}</span>
                  {plan.recommended && (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Popular</span>
                  )}
                  {plan.isCoffee && (
                    <span className="text-xs bg-amber-400 text-gray-900 px-2 py-0.5 rounded-full">one-time</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{plan.credits}</p>
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {plan.features.slice(0, 3).map(f => (
                    <li key={f} className="text-xs text-gray-600 flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-600" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-lg font-black text-gray-900">
                  ${plan.price}
                  {plan.interval === 'month' && <span className="text-xs font-normal text-gray-500">/mo</span>}
                </div>
                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={!!loading}
                  className={`mt-1 px-3 py-1.5 rounded-lg text-sm font-bold transition disabled:opacity-60 ${
                    plan.isCoffee
                      ? 'bg-amber-400 text-gray-900 hover:bg-amber-300'
                      : plan.recommended
                      ? 'bg-green-700 text-white hover:bg-green-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {loading === plan.id ? '…' : plan.isCoffee ? 'Buy' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5 text-center text-xs text-gray-400">
          Secure payments by Stripe · Cancel anytime
        </div>
      </div>
    </div>
  );
}
