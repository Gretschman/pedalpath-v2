import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import type { BOMData, BOMComponent } from '../../types/bom.types';
import { estimateBOMCost } from '../../services/claude-vision';

interface BOMExportProps {
  bomData: BOMData;
  projectName?: string;
}

export default function BOMExport({ bomData, projectName = 'Pedal Build' }: BOMExportProps) {

  /**
   * Export BOM as CSV file
   */
  const exportAsCSV = () => {
    const headers = [
      'Component Type',
      'Value',
      'Quantity',
      'Reference Designators',
      'Part Number',
      'Supplier',
      'Supplier URL',
      'Verified',
      'Notes'
    ];

    const rows = bomData.components.map((component: BOMComponent) => [
      component.component_type,
      component.value,
      component.quantity.toString(),
      component.reference_designators.join(', '),
      component.part_number || '',
      component.supplier || '',
      component.supplier_url || '',
      component.verified ? 'Yes' : 'No',
      component.notes || ''
    ]);

    // Add summary rows
    const summaryRows = [
      [],
      ['SUMMARY'],
      ['Total Components', bomData.components.reduce((sum, c) => sum + c.quantity, 0).toString()],
      ['Unique Parts', bomData.components.length.toString()],
      ['Estimated Cost', `$${estimateBOMCost(bomData.components).toFixed(2)}`],
      [],
    ];

    // Add enclosure info if available
    if (bomData.enclosure) {
      summaryRows.push(
        ['ENCLOSURE'],
        ['Size', bomData.enclosure.size],
        ['Drill Count', bomData.enclosure.drill_count.toString()],
        []
      );
    }

    // Add power info if available
    if (bomData.power) {
      summaryRows.push(
        ['POWER REQUIREMENTS'],
        ['Voltage', bomData.power.voltage],
        ['Current', bomData.power.current || 'N/A'],
        ['Polarity', bomData.power.polarity],
        []
      );
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ...summaryRows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/\s+/g, '_')}_BOM.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export BOM as formatted text file (pseudo-PDF)
   */
  const exportAsText = () => {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(80));
    lines.push(`BILL OF MATERIALS: ${projectName.toUpperCase()}`);
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push(`AI Confidence Score: ${bomData.confidence_score}%`);
    lines.push('='.repeat(80));
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push('-'.repeat(80));
    lines.push(`Total Components: ${bomData.components.reduce((sum, c) => sum + c.quantity, 0)}`);
    lines.push(`Unique Parts: ${bomData.components.length}`);
    lines.push(`Estimated Cost: $${estimateBOMCost(bomData.components).toFixed(2)}`);
    lines.push('');

    // Enclosure
    if (bomData.enclosure) {
      lines.push('ENCLOSURE');
      lines.push('-'.repeat(80));
      lines.push(`Size: ${bomData.enclosure.size}`);
      lines.push(`Drill Count: ${bomData.enclosure.drill_count}`);
      if (bomData.enclosure.notes) {
        lines.push(`Notes: ${bomData.enclosure.notes}`);
      }
      lines.push('');
    }

    // Power
    if (bomData.power) {
      lines.push('POWER REQUIREMENTS');
      lines.push('-'.repeat(80));
      lines.push(`Voltage: ${bomData.power.voltage}`);
      if (bomData.power.current) {
        lines.push(`Current: ${bomData.power.current}`);
      }
      lines.push(`Polarity: ${bomData.power.polarity}`);
      lines.push('');
    }

    // Components grouped by type
    const groupedComponents = bomData.components.reduce((groups, component) => {
      const type = component.component_type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(component);
      return groups;
    }, {} as Record<string, BOMComponent[]>);

    lines.push('COMPONENTS');
    lines.push('='.repeat(80));
    lines.push('');

    Object.entries(groupedComponents).forEach(([type, components]) => {
      lines.push(type.toUpperCase().replace(/-/g, ' '));
      lines.push('-'.repeat(80));

      components.forEach((component: BOMComponent) => {
        lines.push(`  ${component.value} (x${component.quantity})`);
        lines.push(`    References: ${component.reference_designators.join(', ')}`);
        if (component.part_number) {
          lines.push(`    Part Number: ${component.part_number}`);
        }
        if (component.supplier) {
          lines.push(`    Supplier: ${component.supplier}`);
        }
        if (component.supplier_url) {
          lines.push(`    URL: ${component.supplier_url}`);
        }
        if (component.notes) {
          lines.push(`    Notes: ${component.notes}`);
        }
        lines.push(`    Verified: ${component.verified ? 'Yes' : 'No'}`);
        lines.push('');
      });

      lines.push('');
    });

    // Footer
    lines.push('='.repeat(80));
    lines.push('Generated by PedalPath - DIY Guitar Pedal Builder');
    lines.push('https://github.com/Gretschman/pedalpath-v2');
    lines.push('='.repeat(80));

    const textContent = lines.join('\n');

    // Download file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/\s+/g, '_')}_BOM.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Copy shopping list to clipboard (for easy pasting into supplier search)
   */
  const copyShoppingList = () => {
    const shoppingList = bomData.components.map((component: BOMComponent) =>
      `${component.quantity}x ${component.value} ${component.component_type}`
    ).join('\n');

    navigator.clipboard.writeText(shoppingList).then(() => {
      alert('Shopping list copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard. Please try again.');
    });
  };

  const totalCost = estimateBOMCost(bomData.components);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export BOM</h3>
          <p className="text-sm text-gray-600 mt-1">
            Download your bill of materials in different formats
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Estimated Cost</div>
          <div className="text-2xl font-bold text-green-600">
            ${totalCost.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV Export */}
        <button
          onClick={exportAsCSV}
          className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
        >
          <FileSpreadsheet className="w-12 h-12 text-green-600 mb-3" />
          <div className="font-medium text-gray-900">Export as CSV</div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            Spreadsheet format for Excel/Sheets
          </div>
        </button>

        {/* Text Export */}
        <button
          onClick={exportAsText}
          className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <FileText className="w-12 h-12 text-blue-600 mb-3" />
          <div className="font-medium text-gray-900">Export as Text</div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            Formatted text document
          </div>
        </button>

        {/* Copy Shopping List */}
        <button
          onClick={copyShoppingList}
          className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <Download className="w-12 h-12 text-purple-600 mb-3" />
          <div className="font-medium text-gray-900">Copy Shopping List</div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            Quick list for supplier search
          </div>
        </button>
      </div>

      {/* Supplier Links */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-3">Popular Suppliers</h4>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://www.taydaelectronics.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
          >
            Tayda Electronics
          </a>
          <a
            href="https://www.mouser.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Mouser
          </a>
          <a
            href="https://www.digikey.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
          >
            Digikey
          </a>
          <a
            href="https://www.smallbear-electronics.mybigcommerce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
          >
            Small Bear Electronics
          </a>
        </div>
      </div>
    </div>
  );
}
