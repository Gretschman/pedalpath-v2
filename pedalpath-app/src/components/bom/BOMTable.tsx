import { useState } from 'react';
import type { BOMComponent, BOMData } from '../../types/bom.types';
import { updateBOMComponent } from '../../services/schematic-processor';
import { Edit2, Check, X, ExternalLink } from 'lucide-react';

interface BOMTableProps {
  bomData: BOMData;
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

export default function BOMTable({ bomData, onUpdate }: BOMTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BOMComponent>>({});

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

  // Group components by type
  const groupedComponents = bomData.components.reduce((groups, component) => {
    const type = component.component_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(component);
    return groups;
  }, {} as Record<string, BOMComponent[]>);

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
              Review and verify components below. You can edit any values.
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

          <div className="overflow-x-auto">
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {components.map((component) => {
                  const isEditing = editingId === component.id;

                  return (
                    <tr key={component.id} className={component.verified ? 'bg-green-50' : ''}>
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(component)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
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
    </div>
  );
}
