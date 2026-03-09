// ComponentVisualEngine — Sprint 2 BOM card rendering
// Selects the correct SVG sprite and applies CSS-var decorators.
// Do NOT modify existing breadboard SVG components (ResistorSVG.tsx etc.)

import React from 'react';
import type { BOMComponent } from '@/types/bom.types';
import { getResistorBandColors } from './decorators/ResistorBandDecorator';
import { getLEDColorVars } from './decorators/LEDColorDecorator';
import { getCapacitorSpriteId } from './decorators/CapacitorBodySelector';
import { getICSpriteId } from './decorators/ICPinCountSelector';

// SVG sprites loaded as raw strings via Vite ?raw imports
import resistorAxial from './components-svg/resistor-axial.svg?raw';
import capacitorElectrolytic from './components-svg/capacitor-electrolytic.svg?raw';
import capacitorCeramicDisc from './components-svg/capacitor-ceramic-disc.svg?raw';
import capacitorFilm from './components-svg/capacitor-film.svg?raw';
import capacitorTantalum from './components-svg/capacitor-tantalum.svg?raw';
import diodeSignal from './components-svg/diode-signal.svg?raw';
import diodeZener from './components-svg/diode-zener.svg?raw';
import transistorTo92 from './components-svg/transistor-to92.svg?raw';
import transistorTo18 from './components-svg/transistor-to18.svg?raw';
import icDip8 from './components-svg/ic-dip8.svg?raw';
import icDip14 from './components-svg/ic-dip14.svg?raw';
import icDip16 from './components-svg/ic-dip16.svg?raw';
import jackMonoTs from './components-svg/jack-mono-ts.svg?raw';
import jackBarrel from './components-svg/jack-barrel.svg?raw';
import potAlphaRound from './components-svg/pot-alpha-round.svg?raw';
import switchDpdtStomp from './components-svg/switch-dpdt-stomp.svg?raw';
import led5mm from './components-svg/led-5mm.svg?raw';
import led3mm from './components-svg/led-3mm.svg?raw';

// ---------------------------------------------------------------------------
// Sprite map
// ---------------------------------------------------------------------------

type SpriteId =
  | 'resistor-axial'
  | 'capacitor-electrolytic'
  | 'capacitor-ceramic-disc'
  | 'capacitor-film'
  | 'capacitor-tantalum'
  | 'diode-signal'
  | 'diode-zener'
  | 'transistor-to92'
  | 'transistor-to18'
  | 'ic-dip8'
  | 'ic-dip14'
  | 'ic-dip16'
  | 'jack-mono-ts'
  | 'jack-barrel'
  | 'pot-alpha-round'
  | 'switch-dpdt-stomp'
  | 'led-5mm'
  | 'led-3mm';

const SPRITE_MAP: Record<SpriteId, string> = {
  'resistor-axial':         resistorAxial,
  'capacitor-electrolytic': capacitorElectrolytic,
  'capacitor-ceramic-disc': capacitorCeramicDisc,
  'capacitor-film':         capacitorFilm,
  'capacitor-tantalum':     capacitorTantalum,
  'diode-signal':           diodeSignal,
  'diode-zener':            diodeZener,
  'transistor-to92':        transistorTo92,
  'transistor-to18':        transistorTo18,
  'ic-dip8':                icDip8,
  'ic-dip14':               icDip14,
  'ic-dip16':               icDip16,
  'jack-mono-ts':           jackMonoTs,
  'jack-barrel':            jackBarrel,
  'pot-alpha-round':        potAlphaRound,
  'switch-dpdt-stomp':      switchDpdtStomp,
  'led-5mm':                led5mm,
  'led-3mm':                led3mm,
};

// ---------------------------------------------------------------------------
// Sprite selection
// ---------------------------------------------------------------------------

function selectSpriteId(component: BOMComponent): SpriteId {
  const type = component.component_type;
  const value = (component.value ?? '').toLowerCase();
  const notes = (component.notes ?? '').toLowerCase();

  switch (type) {
    case 'resistor':
      return 'resistor-axial';

    case 'capacitor': {
      // notes field may carry package hint (e.g. "electrolytic")
      const packageHint = notes;
      const spriteId = getCapacitorSpriteId(packageHint, component.value);
      return spriteId;
    }

    case 'diode':
      if (value.includes('zener') || value.startsWith('bz') || value.match(/\dv\d/)) {
        return 'diode-zener';
      }
      return 'diode-signal';

    case 'led':
      if (value.includes('3mm') || notes.includes('3mm')) return 'led-3mm';
      return 'led-5mm';

    case 'transistor': {
      // Germanium transistors use TO-18 metal can
      const isGe = value.match(/^ac\d|^oc\d|^ge|^ad\d|^af\d/i) !== null
        || notes.includes('ge')
        || notes.includes('germanium')
        || notes.includes('to-18')
        || notes.includes('to18');
      return isGe ? 'transistor-to18' : 'transistor-to92';
    }

    case 'ic':
    case 'op-amp': {
      const spriteId = getICSpriteId(component.value);
      return spriteId;
    }

    case 'input-jack':
    case 'output-jack':
      return 'jack-mono-ts';

    case 'dc-jack':
      return 'jack-barrel';

    case 'potentiometer':
      return 'pot-alpha-round';

    case 'footswitch':
    case 'switch':
      return 'switch-dpdt-stomp';

    default:
      return 'resistor-axial'; // safe fallback
  }
}

// ---------------------------------------------------------------------------
// CSS var decoration
// ---------------------------------------------------------------------------

function getCssVars(component: BOMComponent): Record<string, string> {
  const type = component.component_type;

  if (type === 'resistor') {
    return getResistorBandColors(component.value) as unknown as Record<string, string>;
  }

  if (type === 'led') {
    return getLEDColorVars(component.value) as unknown as Record<string, string>;
  }

  return {};
}

// ---------------------------------------------------------------------------
// Engine function
// ---------------------------------------------------------------------------

export interface ComponentVisualResult {
  svgString: string;
  cssVars: Record<string, string>;
  spriteId: string;
}

export function resolveComponentVisual(component: BOMComponent): ComponentVisualResult {
  const spriteId = selectSpriteId(component);
  const svgString = SPRITE_MAP[spriteId] ?? SPRITE_MAP['resistor-axial'];
  const cssVars = getCssVars(component);
  return { svgString, cssVars, spriteId };
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export interface ComponentVisualProps {
  component: BOMComponent;
  className?: string;
}

export function ComponentVisual({ component, className }: ComponentVisualProps): React.ReactElement {
  const { svgString, cssVars } = resolveComponentVisual(component);

  return (
    <div
      className={className}
      style={cssVars as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
