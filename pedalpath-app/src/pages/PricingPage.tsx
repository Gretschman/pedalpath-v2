import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Coffee, Zap } from 'lucide-react';
import { PRICING_PLANS, type PricingPlan } from '../types/subscription.types';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.id === 'free') return;
    if (!user) { window.location.href = '/signup'; return; }

    setLoading(plan.id);
    setError(null);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: plan.id, userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Build more pedals, spend less time on BOM hell
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a schematic image → get a complete bill of materials, breadboard layout,
            and step-by-step build guide in seconds.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Coffee CTA — distinct one-time block */}
        <div className="mb-8">
          <CoffeeTier
            plan={PRICING_PLANS.find(p => p.id === 'coffee')!}
            onSelect={handleSelectPlan}
            loading={loading === 'coffee'}
          />
        </div>

        {/* Subscription tiers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {PRICING_PLANS.filter(p => p.id !== 'coffee').map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={handleSelectPlan}
              loading={loading === plan.id}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-400 mt-10">
          All paid plans include Stripe-secured checkout · Cancel anytime · No questions asked
        </p>
      </div>
    </div>
  );
}

// ─── Coffee tier (one-time, styled distinctly) ────────────────────────────────

function CoffeeTier({ plan, onSelect, loading }: {
  plan: PricingPlan;
  onSelect: (p: PricingPlan) => void;
  loading: boolean;
}) {
  return (
    <div className="relative bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
      <div className="flex-shrink-0 bg-amber-400 rounded-full p-4">
        <Coffee className="w-8 h-8 text-gray-900" />
      </div>

      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
          <span className="font-black text-xl text-gray-900">Coffee</span>
          <span className="bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
            one-time
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{plan.tagline} — no subscription, no commitment</p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          {plan.features.map(f => (
            <span key={f} className="flex items-center gap-1 text-xs text-gray-700">
              <Check className="w-3.5 h-3.5 text-amber-600" /> {f}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center flex-shrink-0">
        <div className="text-3xl font-black text-gray-900 mb-0.5">${plan.price}</div>
        <div className="text-xs text-gray-500 mb-3">{plan.credits}</div>
        <button
          onClick={() => onSelect(plan)}
          disabled={loading}
          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl transition disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? 'Redirecting…' : 'Buy Credits — $5'}
        </button>
      </div>
    </div>
  );
}

// ─── Standard plan card ───────────────────────────────────────────────────────

function PlanCard({ plan, onSelect, loading }: {
  plan: PricingPlan;
  onSelect: (p: PricingPlan) => void;
  loading: boolean;
}) {
  const isFree = plan.id === 'free';

  return (
    <div className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
      plan.recommended
        ? 'border-green-600 shadow-lg'
        : 'border-gray-200'
    }`}>
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" /> Most Popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-black text-gray-900">{plan.name}</h3>
        <p className="text-xs text-gray-500">{plan.tagline}</p>
      </div>

      <div className="mb-4">
        {isFree ? (
          <span className="text-3xl font-black text-gray-900">Free</span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">${plan.price}</span>
            <span className="text-gray-500 text-sm">/mo</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-0.5">{plan.credits}</p>
      </div>

      <ul className="space-y-2 flex-1 mb-6">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {isFree ? (
        <div className="w-full py-2.5 rounded-xl bg-gray-50 text-center text-sm text-gray-500 font-medium">
          {plan.id === 'free' && <Link to="/signup" className="hover:text-gray-700">Get started free →</Link>}
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan)}
          disabled={loading}
          className={`w-full py-2.5 rounded-xl font-bold transition disabled:opacity-60 ${
            plan.recommended
              ? 'bg-green-700 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {loading ? 'Redirecting…' : `Get ${plan.name}`}
        </button>
      )}
    </div>
  );
}
