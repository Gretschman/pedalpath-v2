import { useState, useEffect, useRef } from 'react';
import type { BOMComponent, BOMData } from '../../types/bom.types';
import { updateBOMComponent, submitComponentCorrections } from '../../services/schematic-processor';
import type { ComponentCorrection } from '../../services/schematic-processor';
import { Edit2, Check, X, ExternalLink, Flag, AlertTriangle, Send } from 'lucide-react';

// ─── Supplier link types + fetcher ────────────────────────────────

interface SupplierLink {
  supplier: 'tayda' | 'mouser';
  url: string;
  price_usd?: number | null;
  in_stock: boolean;
}

// Simple request-dedup cache keyed by "type|value"
const supplierCache = new Map<string, SupplierLink[]>();

async function fetchSupplierLinks(componentType: string, value: string): Promise<SupplierLink[]> {
  const key = `${componentType}|${value}`;
  if (supplierCache.has(key)) return supplierCache.get(key)!;
  try {
    const res = await fetch(
      `/api/supplier-links?type=${encodeURIComponent(componentType)}&value=${encodeURIComponent(value)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const links: SupplierLink[] = data.success ? (data.links ?? []) : [];
    supplierCache.set(key, links);
    return links;
  } catch {
    return [];
  }
}

function useSupplierLinks(componentType: string, value: string) {
  const [links, setLinks] = useState<SupplierLink[]>([]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    fetchSupplierLinks(componentType, value).then((l) => {
      if (mounted.current) setLinks(l);
    });
    return () => { mounted.current = false; };
  }, [componentType, value]);
  return links;
}

// ─── Supplier badge component ──────────────────────────────────────

function SupplierBadges({ componentType, value }: { componentType: string; value: string }) {
  const links = useSupplierLinks(componentType, value);
  const tayda = links.find((l) => l.supplier === 'tayda');
  const mouser = links.find((l) => l.supplier === 'mouser');

  return (
    <span className="inline-flex gap-1 ml-1">
      {tayda ? (
        <a
          href={tayda.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Tayda Electronics${tayda.price_usd != null ? ` — $${tayda.price_usd.toFixed(2)}` : ''}${!tayda.in_stock ? ' (out of stock)' : ''}`}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ${
            tayda.in_stock
              ? 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
              : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}
        >
          T
        </a>
      ) : (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border bg-gray-50 text-gray-300 border-gray-200 cursor-default" title="Not found at Tayda">
          T
        </span>
      )}
      {mouser ? (
        <a
          href={mouser.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Mouser Electronics${mouser.price_usd != null ? ` — $${mouser.price_usd.toFixed(2)}` : ''}${!mouser.in_stock ? ' (out of stock)' : ''}`}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ${
            mouser.in_stock
              ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
            : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}
        >
          M
        </a>
      ) : (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border bg-gray-50 text-gray-300 border-gray-200 cursor-default" title="Not found at Mouser">
          M
        </span>
      )}
    </span>
  );
}

interface BOMTableProps {
  bomData: BOMData;
  schematicId?: string;
  onUpdate?: () => void;
}

// Component type display names
const COMPONENT_TYPE_LABELS: Record<string, string> = {
  resistor: 'Resistor',
  capacitor: 'Capacitor',
  diode: 'Diode',
  transistor: 'Transistor',
  ic: 'IC',
  'op-amp': 'Op-Amp',
  'input-jack': 'Input Jack',
  'output-jack': 'Output Jack',
  'dc-jack': 'DC Jack',
  footswitch: 'Footswitch',
  potentiometer: 'Potentiometer',
  led: 'LED',
  switch: 'Switch',
  other: 'Other',
};

// Confidence level colors
const getConfidenceColor = (confidence?: number): string => {
  if (!confidence) return 'bg-gray-100 text-gray-800';
  if (confidence >= 90) return 'bg-green-100 text-green-800';
  if (confidence >= 70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export default function BOMTable({ bomData, schematicId, onUpdate }: BOMTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BOMComponent>>({});

  // Flag state
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [flagNotes, setFlagNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const startEditing = (component: BOMComponent) => {
    setEditingId(component.id || null);
    setEditForm({
      value: component.value,
      quantity: component.quantity,
      notes: component.notes,
      verified: component.verified,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async (componentId: string) => {
    const success = await updateBOMComponent(componentId, {
      ...editForm,
      verified: true,
    });

    if (success) {
      setEditingId(null);
      setEditForm({});
      onUpdate?.();
    } else {
      alert('Failed to update component. Please try again.');
    }
  };

  const toggleFlag = (componentId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
        setFlagNotes((n) => { const copy = { ...n }; delete copy[componentId]; return copy; });
      } else {
        next.add(componentId);
      }
      return next;
    });
  };

  const handleSubmitCorrections = async () => {
    setSubmitting(true);

    const corrections: ComponentCorrection[] = [];
    for (const id of flaggedIds) {
      const component = bomData.components.find((c) => c.id === id);
      if (!component) continue;
      corrections.push({
        componentId: id,
        schematicId,
        componentType: component.component_type,
        reportedValue: component.value,
        issueType: 'wrong_value',
        description: flagNotes[id] || undefined,
      });
    }

    const ok = await submitComponentCorrections(corrections);
    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
      setFlaggedIds(new Set());
      setFlagNotes({});
    } else {
      alert('Failed to submit corrections. Please try again.');
    }
  };

  // Group components by type
  const groupedComponents = bomData.components.reduce((groups, component) => {
    const type = component.component_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(component);
    return groups;
  }, {} as Record<string, BOMComponent[]>);

  const flagCount = flaggedIds.size;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Components</div>
          <div className="text-2xl font-bold text-gray-900">
            {bomData.components.reduce((sum, c) => sum + c.quantity, 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {bomData.components.length} unique parts
          </div>
        </div>

        {bomData.enclosure && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Enclosure</div>
            <div className="text-2xl font-bold text-gray-900">
              {bomData.enclosure.size}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {bomData.enclosure.drill_count || 0} holes needed
            </div>
          </div>
        )}

        {bomData.power && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Power</div>
            <div className="text-2xl font-bold text-gray-900">
              {bomData.power.voltage}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {bomData.power.polarity.replace('-', ' ')}
            </div>
          </div>
        )}
      </div>

      {/* Confidence Score */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-blue-900">AI Confidence Score</div>
            <div className="text-sm text-blue-700">
              Review and verify components below. Use the flag button to report any errors.
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {bomData.confidence_score}%
          </div>
        </div>
      </div>

      {/* Components by Type */}
      {Object.entries(groupedComponents).map(([type, components]) => (
        <div key={type} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {COMPONENT_TYPE_LABELS[type] || type}
            </h3>
            <div className="text-sm text-gray-600">
              {components.reduce((sum, c) => sum + c.quantity, 0)} items
            </div>
          </div>

          {/* Mobile: card list */}
          <div className="sm:hidden divide-y divide-gray-100">
            {components.map((component) => {
              const isEditing = editingId === component.id;
              const isFlagged = component.id ? flaggedIds.has(component.id) : false;
              return (
                <div
                  key={component.id}
                  className={`p-4 space-y-3 ${isFlagged ? 'bg-orange-50' : component.verified ? 'bg-green-50' : ''}`}
                >
                  {/* Value + Qty row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.value || ''}
                          onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                        />
                      ) : (
                        <div className="font-medium text-gray-900">{component.value}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.quantity || 0}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">×{component.quantity}</span>
                      )}
                    </div>
                  </div>

                  {/* Supplier badges (mobile) */}
                  <SupplierBadges componentType={component.component_type} value={component.value} />

                  {/* References */}
                  <div className="flex flex-wrap gap-1">
                    {component.reference_designators.map((ref) => (
                      <span
                        key={ref}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {ref}
                      </span>
                    ))}
                    {component.confidence && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(component.confidence)}`}>
                        {component.confidence}%
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Add notes..."
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                    />
                  ) : (
                    component.notes && (
                      <div className="text-sm text-gray-500">{component.notes}</div>
                    )
                  )}

                  {/* Flag note input */}
                  {isFlagged && component.id && (
                    <input
                      type="text"
                      value={flagNotes[component.id] || ''}
                      onChange={(e) => setFlagNotes((n) => ({ ...n, [component.id!]: e.target.value }))}
                      placeholder="What's wrong? (optional)"
                      className="border border-orange-300 bg-orange-50 rounded px-2 py-1 text-sm w-full"
                    />
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEditing(component.id!)}
                          className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-green-600 rounded-lg"
                        >
                          <Check size={16} />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(component)}
                          className="flex items-center gap-1 px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        {component.id && (
                          <button
                            onClick={() => toggleFlag(component.id!)}
                            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg ${
                              isFlagged
                                ? 'text-orange-700 bg-orange-100'
                                : 'text-gray-500 bg-gray-50'
                            }`}
                            title="Flag incorrect component"
                          >
                            <Flag size={16} />
                            {isFlagged ? 'Flagged' : 'Flag'}
                          </button>
                        )}
                        {component.supplier_url && (
                          <a
                            href={component.supplier_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg"
                          >
                            <ExternalLink size={16} />
                            Buy
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    References
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Buy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {components.map((component) => {
                  const isEditing = editingId === component.id;
                  const isFlagged = component.id ? flaggedIds.has(component.id) : false;

                  return (
                    <tr key={component.id} className={isFlagged ? 'bg-orange-50' : component.verified ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.value || ''}
                            onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                          />
                        ) : (
                          <div className="font-medium text-gray-900">{component.value}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.quantity || 0}
                            onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                          />
                        ) : (
                          <span className="text-gray-900">{component.quantity}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {component.reference_designators.map((ref) => (
                            <span
                              key={ref}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {ref}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {component.confidence && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(component.confidence)}`}>
                            {component.confidence}%
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.notes || ''}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            placeholder="Add notes..."
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">{component.notes || '—'}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <SupplierBadges componentType={component.component_type} value={component.value} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditing(component.id!)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => startEditing(component)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            {component.id && (
                              <button
                                onClick={() => toggleFlag(component.id!)}
                                className={isFlagged ? 'text-orange-500 hover:text-orange-700' : 'text-gray-300 hover:text-orange-400'}
                                title={isFlagged ? 'Remove flag' : 'Flag incorrect component'}
                              >
                                <Flag size={18} />
                              </button>
                            )}
                            {component.supplier_url && (
                              <a
                                href={component.supplier_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800"
                                title="Buy"
                              >
                                <ExternalLink size={18} />
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Correction submission panel */}
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-green-900">Corrections submitted — thank you!</div>
            <div className="text-sm text-green-700">Your feedback helps improve AI accuracy for everyone.</div>
          </div>
        </div>
      ) : flagCount > 0 ? (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-orange-900">
                  {flagCount} component{flagCount !== 1 ? 's' : ''} flagged for correction
                </div>
                <div className="text-sm text-orange-700">
                  Submit to help improve AI parsing accuracy. Your corrections are anonymous.
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmitCorrections}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 flex-shrink-0"
            >
              <Send size={16} />
              {submitting ? 'Sending…' : 'Submit Report'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
