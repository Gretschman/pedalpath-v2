/**
 * Stripboard Demo Page
 *
 * Visual verification page for StripboardView component.
 * Add ?copper=1 to URL to pre-select the copper side view.
 */

import StripboardView from '../components/visualizations/StripboardView';

export default function StripboardDemo() {
  const copper = new URLSearchParams(window.location.search).get('copper') === '1';
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Stripboard Demo</h1>
      <StripboardView showDemo={true} viewMode={copper ? 'copper' : 'component'} />
    </div>
  );
}
