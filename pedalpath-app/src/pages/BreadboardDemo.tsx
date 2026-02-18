/**
 * Breadboard Demo Page
 *
 * Visual verification page for BreadboardBase component.
 * Allows testing different sizes, highlighting, and interactions.
 */

import { useState } from 'react';
import BreadboardBase from '../components/visualizations/BreadboardBase';

export default function BreadboardDemo() {
  const [size, setSize] = useState<'830' | '400'>('830');
  const [highlightedHoles, setHighlightedHoles] = useState<string[]>([]);
  const [clickedHole, setClickedHole] = useState<string | null>(null);

  const handleHoleClick = (holeId: string) => {
    setClickedHole(holeId);

    // Toggle highlight
    if (highlightedHoles.includes(holeId)) {
      setHighlightedHoles(highlightedHoles.filter(h => h !== holeId));
    } else {
      setHighlightedHoles([...highlightedHoles, holeId]);
    }
  };

  const clearHighlights = () => {
    setHighlightedHoles([]);
    setClickedHole(null);
  };

  const highlightExample = () => {
    // Highlight some example holes (simulating an IC placement)
    setHighlightedHoles(['a15', 'a16', 'a17', 'a18', 'f15', 'f16', 'f17', 'f18']);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Breadboard Component Demo</h1>

      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSize('830')}
          style={{
            padding: '10px 20px',
            backgroundColor: size === '830' ? '#0066CC' : '#F5F5F5',
            color: size === '830' ? 'white' : 'black',
            border: '1px solid #CCC',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          830-Point
        </button>

        <button
          onClick={() => setSize('400')}
          style={{
            padding: '10px 20px',
            backgroundColor: size === '400' ? '#0066CC' : '#F5F5F5',
            color: size === '400' ? 'white' : 'black',
            border: '1px solid #CCC',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          400-Point
        </button>

        <button
          onClick={highlightExample}
          style={{
            padding: '10px 20px',
            backgroundColor: '#CC0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Highlight Example
        </button>

        <button
          onClick={clearHighlights}
          style={{
            padding: '10px 20px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Highlights
        </button>
      </div>

      {/* Info Display */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#F5F5F5', borderRadius: '4px' }}>
        <p style={{ margin: '5px 0' }}>
          <strong>Size:</strong> {size} tie points
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Highlighted Holes:</strong>{' '}
          {highlightedHoles.length > 0 ? highlightedHoles.join(', ') : 'None'}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Last Clicked:</strong> {clickedHole || 'None'}
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
          💡 Click any hole to highlight it. Red/blue stripes are power rails.
        </p>
      </div>

      {/* Breadboard Component */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'inline-block',
          maxWidth: '100%',
        }}
      >
        <BreadboardBase
          size={size}
          highlightHoles={highlightedHoles}
          onHoleClick={handleHoleClick}
        />
      </div>

      {/* Verification Checklist */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#F9F9F9', borderRadius: '8px' }}>
        <h2>Visual Verification Checklist</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ Power rails on TOP and BOTTOM (not sides)</li>
          <li>✅ Red stripes for positive (+), blue for ground (−)</li>
          <li>✅ Column numbers 1-{size === '830' ? '63' : '30'} visible</li>
          <li>✅ Row letters a-j visible on left side</li>
          <li>✅ Center gap visible between rows e and f</li>
          <li>✅ Holes have dark interior with metallic rim</li>
          <li>✅ Hover effect works on holes</li>
          <li>✅ Click to highlight holes works</li>
          <li>✅ White/light grey base color (#F5F5F5)</li>
          <li>✅ Proper hole spacing (2.54mm standard IC pitch)</li>
        </ul>
      </div>
    </div>
  );
}
