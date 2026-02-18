import { useState } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { PRICING_PLANS, type PricingPlan } from '../../types/subscription.types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: PricingPlan) => void;
  reason?: 'limit_reached' | 'feature_locked';
}

export function PricingModal({ isOpen, onClose, onSelectPlan, reason = 'limit_reached' }: PricingModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');

  if (!isOpen) return null;

  const getMessage = () => {
    if (reason === 'limit_reached') {
      return {
        title: "You've Reached Your Free Limit",
        subtitle: "Upgrade to continue building amazing pedals"
      };
    }
    return {
      title: 'This Feature Requires Pro',
      subtitle: 'Unlock all features with a Pro subscription'
    };
  };

  const { title, subtitle } = getMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-4 sm:p-8 text-center border-b">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-base sm:text-lg text-gray-600">{subtitle}</p>
        </div>

        {/* Pricing cards */}
        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isFree = plan.id === 'free';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-6 transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.recommended ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  onClick={() => !isFree && setSelectedPlanId(plan.id)}
                >
                  {/* Recommended badge */}
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Plan name */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-500">
                        /{plan.interval === 'month' ? 'month' : 'upload'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  {!isFree && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlan(plan);
                      }}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                        plan.recommended
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {plan.interval === 'month' ? 'Start Free Trial' : 'Pay Once'}
                    </button>
                  )}

                  {isFree && (
                    <div className="w-full py-3 px-4 rounded-lg bg-gray-50 text-center text-sm text-gray-500 font-medium">
                      Current Plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t text-center text-sm text-gray-600">
          <p>All plans include a 7-day free trial. Cancel anytime. No questions asked.</p>
          <p className="mt-2">Secure payments powered by Stripe.</p>
        </div>
      </div>
    </div>
  );
}
