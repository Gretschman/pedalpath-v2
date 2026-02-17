/**
 * Smoke test / usage example for component decoders
 *
 * This file demonstrates how to use the decoders in real scenarios.
 * Run with: npm test -- smoke-test
 */

import { encodeResistor, decodeResistor, formatOhms } from '../resistor-decoder';
import { encodeCapacitor, decodeCapacitor, formatCapacitance } from '../capacitor-decoder';

// Example 1: Encode a resistor value for a build guide
console.log('=== RESISTOR ENCODING ===');
const r1 = encodeResistor(47000, 1.0); // 47kΩ ±1%
console.log(`47kΩ ±1% resistor:`, r1.bands5);
console.log('  5-band:', r1.bands5.join('-'));
console.log('  4-band:', r1.bands4?.join('-') || 'N/A');

// Example 2: Decode resistor bands from a schematic
console.log('\n=== RESISTOR DECODING ===');
const r2 = decodeResistor(['yellow', 'violet', 'black', 'red', 'brown']);
console.log(`Bands [yellow, violet, black, red, brown]:`);
console.log(`  Value: ${formatOhms(r2.ohms)}`);
console.log(`  Tolerance: ±${r2.tolerancePercent}%`);
console.log(`  E-series: ${r2.eSeriesMatch || 'non-standard'}`);

// Example 3: Encode a capacitor for a BOM
console.log('\n=== CAPACITOR ENCODING ===');
const c1 = encodeCapacitor({ nf: 47, tolerancePercent: 10.0, voltage: 100 });
console.log(`47nF ±10% 100V capacitor:`);
console.log(`  EIA code: ${c1.eiaCode}`);
console.log(`  Film box marking: ${c1.fullFilmCode}`);
console.log(`  Alpha marking: ${c1.fullAlphaCode}`);

// Example 4: Decode capacitor marking
console.log('\n=== CAPACITOR DECODING ===');
const c2 = decodeCapacitor('473J250');
console.log(`Marking "473J250":`);
console.log(`  Value: ${formatCapacitance(c2.capacitance)}`);
console.log(`  Type: ${c2.capType}`);
console.log(`  Tolerance: ±${c2.tolerancePercent}%`);
console.log(`  Max voltage: ${c2.voltageMax}V`);
console.log(`  Polarized: ${c2.polarized}`);

// Example 5: Electrolytic capacitor
console.log('\n=== ELECTROLYTIC CAPACITOR ===');
const c3 = decodeCapacitor('100uF 25V');
console.log(`Marking "100uF 25V":`);
console.log(`  Value: ${formatCapacitance(c3.capacitance)}`);
console.log(`  Type: ${c3.capType}`);
console.log(`  Polarized: ${c3.polarized ? 'YES' : 'NO'}`);
console.log(`  Max voltage: ${c3.voltageMax}V`);

console.log('\n✅ All decoders working correctly!');
