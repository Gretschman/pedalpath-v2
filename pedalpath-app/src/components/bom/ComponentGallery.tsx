/**
 * ComponentGallery
 *
 * Visual "cast of characters" — every component in the BOM rendered as a
 * card with its SVG illustration, value, type badge, and identification hint.
 *
 * Design: dark-green header band, 2–4 column grid of white cards.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { BOMComponent, BOMData } from '../../types/bom.types';
import {
  encodeResistor,
  decodeResistor,
  decodeCapacitor,
  decodeDiode,
  decodeLED,
} from '../../utils/decoders';
import { ResistorSVG, CapacitorSVG, DiodeSVG } from '../visualizations/components-svg';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseOhms(value: string): number {
  const cleaned = value.toLowerCase().replace(/[ωΩ\s]/g, '').replace('ohm', '').replace(/r$/, '');
  const match = cleaned.match(/^(\d+\.?\d*)(k|m)?$/);
  if (!match) return 10_000;
  const [, num, unit] = match;
  const n = parseFloat(num);
  if (unit === 'k') return n * 1_000;
  if (unit === 'm') return n * 1_000_000;
  return n;
}

// ─── Component SVG thumbnail (100×60 viewport) ────────────────────────────────

function GalleryThumbnail({ component }: { component: BOMComponent }) {
  const w = 100; const h = 60;
  const sx = 8;  const sy = 30; const ex = 92; const ey = 30;

  try {
    if (component.component_type === 'resistor') {
      const ohms = parseOhms(component.value);
      const encoded = encodeResistor(ohms, 5);
      const spec = decodeResistor(encoded.bands4 ?? encoded.bands5);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <ResistorSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }
    if (component.component_type === 'capacitor') {
      const spec = decodeCapacitor(component.value);
      // Electrolytic/tantalum: render upright — they always stand vertical in real life
      if (spec.capType === 'electrolytic' || spec.capType === 'tantalum') {
        const bodyW = spec.capType === 'tantalum' ? 16 : 20;
        const bodyH = spec.capType === 'tantalum' ? 22 : 34;
        const bodyColor = spec.capType === 'tantalum' ? '#DDBB00' : '#1A2E4A';
        const bx = (w - bodyW) / 2; const by = 4;
        const leadX1 = w / 2 - 4; const leadX2 = w / 2 + 4;
        return (
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
            {/* Leads going down from body base */}
            <line x1={leadX1} y1={by + bodyH} x2={leadX1} y2={h - 3} stroke="#B8860B" strokeWidth="2" strokeLinecap="round" />
            <line x1={leadX2} y1={by + bodyH} x2={leadX2} y2={h - 3} stroke="#B8860B" strokeWidth="2" strokeLinecap="round" />
            {/* Body */}
            <rect x={bx} y={by} width={bodyW} height={bodyH} fill={bodyColor} rx={bodyW / 2} stroke="#1a1a1a" strokeWidth="0.5" />
            {/* Negative stripe */}
            {spec.polarized && (
              <rect x={bx} y={by} width={bodyW * 0.38} height={bodyH} fill="#D0D8E0" rx={bodyW / 2} opacity="0.85" />
            )}
            {spec.polarized && (
              <text x={bx + bodyW * 0.19} y={by + bodyH * 0.58} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1A2E4A">−</text>
            )}
          </svg>
        );
      }
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <CapacitorSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }
    if (component.component_type === 'diode') {
      const spec = decodeDiode(component.value);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <DiodeSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }
    if (component.component_type === 'led') {
      const spec = decodeLED('red', '5mm');
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <DiodeSVG startX={sx} startY={sy} endX={ex} endY={ey} spec={spec} />
        </svg>
      );
    }
    if (component.component_type === 'transistor') {
      // Simplified TO-92 thumbnail
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          {[36, 50, 64].map((lx, i) => (
            <line key={i} x1={lx} y1={52} x2={lx} y2={38} stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
          ))}
          <path d="M 20 38 L 80 38 A 30 22 0 0 0 20 38 Z" fill="#1A1A1A" stroke="#444" strokeWidth="0.5" />
          <text x={50} y={28} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#CCC">
            {component.value.substring(0, 7)}
          </text>
          {['E', 'B', 'C'].map((p, i) => (
            <text key={p} x={[36, 50, 64][i]} y={58} textAnchor="middle" fontSize="7"
              fontFamily="sans-serif" fill="#666">{p}</text>
          ))}
        </svg>
      );
    }
    if (component.component_type === 'ic' || component.component_type === 'op-amp') {
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <rect x={18} y={10} width={64} height={36} fill="#1A1A1A" stroke="#444" strokeWidth="1" rx={2} />
          <path d="M 46 10 A 4 4 0 0 1 54 10" fill="#2A2A2A" stroke="#444" strokeWidth="0.5" />
          {[0, 1, 2, 3].map(i => (
            <line key={`t${i}`} x1={28 + i * 12} y1={5} x2={28 + i * 12} y2={10} stroke="#A0A0A0" strokeWidth="1.5" />
          ))}
          {[0, 1, 2, 3].map(i => (
            <line key={`b${i}`} x1={28 + i * 12} y1={46} x2={28 + i * 12} y2={51} stroke="#A0A0A0" strokeWidth="1.5" />
          ))}
          <text x={50} y={33} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#CCC" fontWeight="600">
            {component.value.substring(0, 7)}
          </text>
        </svg>
      );
    }
    if (component.component_type === 'potentiometer') {
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <circle cx={50} cy={32} r={22} fill="#888" stroke="#555" strokeWidth="1" />
          <circle cx={50} cy={32} r={11} fill="#666" />
          <line x1={50} y1={21} x2={50} y2={12} stroke="#DDD" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    }
    if (component.component_type === 'input-jack' || component.component_type === 'output-jack') {
      const isIn = component.component_type === 'input-jack';
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <rect x={18} y={26} width={58} height={8} fill="#888" rx={2} />
          <ellipse cx={76} cy={30} rx={7} ry={8} fill="#AAA" stroke="#666" strokeWidth="1" />
          <rect x={28} y={23} width={6} height={14} fill="#555" rx={1} />
          <rect x={40} y={24} width={5} height={12} fill="#666" rx={1} />
          <text x={50} y={52} textAnchor="middle" fontSize="8" fontFamily="sans-serif"
            fill="#555" fontWeight="600">{isIn ? 'INPUT' : 'OUTPUT'}</text>
        </svg>
      );
    }
    if (component.component_type === 'dc-jack') {
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <circle cx={50} cy={27} r={20} fill="#444" stroke="#222" strokeWidth="1.5" />
          <circle cx={50} cy={27} r={13} fill="#666" stroke="#333" strokeWidth="1" />
          <circle cx={50} cy={27} r={5} fill="#AAA" />
          <text x={38} y={53} fontSize="7" fontFamily="sans-serif" fill="#C00" fontWeight="700">+</text>
          <text x={55} y={53} fontSize="7" fontFamily="sans-serif" fill="#AAA" fontWeight="700">−</text>
          <text x={50} y={53} textAnchor="middle" fontSize="7" fontFamily="sans-serif" fill="#888">|</text>
        </svg>
      );
    }
    if (component.component_type === 'footswitch') {
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <rect x={22} y={6} width={56} height={42} fill="#555" stroke="#333" strokeWidth="1.5" rx={3} />
          {([0, 1, 2] as number[]).flatMap(row => ([0, 1, 2] as number[]).map(col => (
            <circle key={`${row}-${col}`}
              cx={35 + col * 15} cy={16 + row * 12}
              r={4} fill="#AAA" stroke="#888" strokeWidth="0.5" />
          )))}
          <text x={50} y={57} textAnchor="middle" fontSize="8" fontFamily="sans-serif"
            fill="#555" fontWeight="600">3PDT</text>
        </svg>
      );
    }
  } catch {
    // fall through
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <rect x={8} y={18} width={84} height={24} fill="#999" rx={3} />
      <text x={50} y={33} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="monospace">
        {component.value.substring(0, 10)}
      </text>
    </svg>
  );
}

// ─── Identification hint lookup ───────────────────────────────────────────────

function identHint(component: BOMComponent): string {
  const t = component.component_type;
  if (t === 'resistor') return 'Color bands on beige/tan body';
  if (t === 'capacitor') {
    const v = component.value.toLowerCase();
    if (v.includes('µf') || v.includes('uf') || v.includes('mf') || parseFloat(v) >= 1) {
      return 'Cylindrical can — check polarity stripe';
    }
    return 'Small yellow or brown disc/box';
  }
  if (t === 'diode') return 'Black body — stripe = cathode (–)';
  if (t === 'led') return 'Clear or colored lens — flat side = cathode';
  if (t === 'transistor') return 'TO-92: flat face toward you — E B C';
  if (t === 'ic' || t === 'op-amp') return 'DIP chip — notch marks pin 1 end';
  if (t === 'potentiometer') return 'Round knurled shaft — 3 solder lugs';
  if (t === 'input-jack' || t === 'output-jack') return '6.35mm mono jack — sleeve = GND';
  if (t === 'dc-jack') return '5.5/2.1mm barrel — center = polarity';
  if (t === 'footswitch') return '3PDT or DPDT stomp switch';
  return '';
}

// ─── Type badge color ─────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  resistor: 'bg-amber-100 text-amber-800',
  capacitor: 'bg-blue-100 text-blue-800',
  diode: 'bg-orange-100 text-orange-800',
  led: 'bg-pink-100 text-pink-800',
  transistor: 'bg-purple-100 text-purple-800',
  ic: 'bg-gray-200 text-gray-700',
  'op-amp': 'bg-gray-200 text-gray-700',
  potentiometer: 'bg-green-100 text-green-800',
  'input-jack': 'bg-teal-100 text-teal-800',
  'output-jack': 'bg-teal-100 text-teal-800',
  'dc-jack': 'bg-slate-100 text-slate-700',
  footswitch: 'bg-indigo-100 text-indigo-800',
};

const TYPE_LABEL: Record<string, string> = {
  resistor: 'R', capacitor: 'C', diode: 'D', led: 'LED',
  transistor: 'Q', ic: 'IC', 'op-amp': 'U', potentiometer: 'POT',
  'input-jack': 'IN', 'output-jack': 'OUT', 'dc-jack': 'PWR', footswitch: 'SW',
};

// ─── Gallery card ─────────────────────────────────────────────────────────────

function GalleryCard({ component }: { component: BOMComponent }) {
  const hint = identHint(component);
  const badgeClass = TYPE_BADGE[component.component_type] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = TYPE_LABEL[component.component_type] ?? component.component_type.toUpperCase().slice(0, 3);

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-3 flex flex-col items-center gap-1.5">
      {/* Quantity badge top-right */}
      {component.quantity > 1 && (
        <span className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
          ×{component.quantity}
        </span>
      )}

      {/* SVG render */}
      <div className="flex items-center justify-center">
        <GalleryThumbnail component={component} />
      </div>

      {/* Value */}
      <div className="font-bold text-gray-900 text-sm text-center leading-tight">
        {component.value}
      </div>

      {/* Type badge */}
      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
        {typeLabel}
      </span>

      {/* Identification hint */}
      {hint && (
        <div className="text-xs text-gray-400 text-center leading-tight mt-0.5">
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ComponentGalleryProps {
  bomData: BOMData;
}

export function ComponentGallery({ bomData }: ComponentGalleryProps) {
  const [open, setOpen] = useState(false);

  const totalQty = bomData.components.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 shadow-md">
      {/* Header band */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-gray-900 px-5 py-4 text-white"
      >
        <div className="text-left">
          <div className="font-black text-base tracking-tight">
            What you'll need — {totalQty} components
          </div>
          <div className="text-white/50 text-xs mt-0.5">
            {bomData.components.length} unique parts · click to {open ? 'collapse' : 'expand'} gallery
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-white/60" /> : <ChevronDown className="w-5 h-5 text-white/60" />}
      </button>

      {/* Grid */}
      {open && (
        <div className="bg-gray-50 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bomData.components.map((component, idx) => (
              <GalleryCard key={component.id ?? idx} component={component} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
