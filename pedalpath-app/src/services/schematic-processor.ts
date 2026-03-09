import { supabase } from './supabase';
import { analyzeSchematicFile } from './claude-vision';
import { uploadSchematic } from './storage';
import { detectImageType } from '../utils/image-utils';
import type { BOMData, BOMComponent } from '../types/bom.types';

interface ProcessSchematicResult {
  success: boolean;
  schematicId?: string;
  bomData?: BOMData;
  error?: string;
}

// ---------------------------------------------------------------------------
// Phase 1: Upload + create DB records (fast, ~2-3s)
// ---------------------------------------------------------------------------

export interface PrepareSchematicResult {
  schematicId: string;
  storagePath: string;
  imageBase64: string;
  imageType: string;
  projectId: string;
}

/**
 * Phase 1 of the async upload flow.
 * Uploads the file to storage and creates the schematic DB record.
 * Returns immediately after record creation — does NOT run AI analysis.
 */
export async function prepareSchematic(
  projectId: string,
  file: File,
  userId: string,
): Promise<PrepareSchematicResult> {
  // Step 0: Detect actual file type from content (don't trust file extension)
  const actualMimeType = await detectImageType(file);
  console.log(`File: ${file.name}, Declared type: ${file.type}, Actual type: ${actualMimeType}`);

  let fileToUpload = file;
  if (actualMimeType !== file.type) {
    console.log(`Correcting mime type from ${file.type} to ${actualMimeType}`);
    fileToUpload = new File([file], file.name, { type: actualMimeType });
  }

  // Step 1: Upload file to storage
  const uploadResult = await uploadSchematic(userId, fileToUpload, projectId);
  if (!uploadResult) {
    throw new Error('Failed to upload schematic file');
  }

  // Step 2: Create schematic record in database with status 'processing'
  const { data: schematic, error: schematicError } = await supabase
    .from('schematics')
    .insert({
      project_id: projectId,
      storage_path: uploadResult.path,
      file_name: file.name,
      file_size: file.size,
      mime_type: actualMimeType,
      processing_status: 'processing',
    })
    .select()
    .single();

  if (schematicError || !schematic) {
    console.error('Error creating schematic record:', schematicError);
    throw new Error('Failed to create schematic record');
  }

  // Read file as base64 for AI analysis
  const imageBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileToUpload);
  });

  return {
    schematicId: schematic.id,
    storagePath: uploadResult.path,
    imageBase64,
    imageType: actualMimeType,
    projectId,
  };
}

// ---------------------------------------------------------------------------
// Phase 2: AI analysis + write BOM to DB (slow, ~45s)
// Called fire-and-forget from UploadPage AFTER navigation
// ---------------------------------------------------------------------------

/**
 * Phase 2 of the async upload flow.
 * Runs AI analysis on an already-uploaded schematic and writes the BOM to DB.
 * Safe to call fire-and-forget — updates processing_status on completion or failure.
 */
export async function analyzeSchematic(
  schematicId: string,
  imageBase64: string,
  imageType: string,
  userId: string,
): Promise<void> {
  // Build a synthetic File-like object for analyzeSchematicFile
  // analyzeSchematicFile accepts a File; we reconstruct from base64
  const binary = atob(imageBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: imageType });
  const syntheticFile = new File([blob], 'schematic', { type: imageType });

  // Fetch schematic record to get project_id
  const { data: schematicRow } = await supabase
    .from('schematics')
    .select('project_id')
    .eq('id', schematicId)
    .single();

  const projectId = schematicRow?.project_id ?? userId; // fallback; project_id should always exist

  const analysisResult = await analyzeSchematicFile(syntheticFile);

  if (!analysisResult.success || !analysisResult.bom_data) {
    await supabase
      .from('schematics')
      .update({
        processing_status: 'failed',
        processing_error: analysisResult.error || 'Analysis failed',
      })
      .eq('id', schematicId);
    throw new Error(analysisResult.error || 'Failed to analyze schematic');
  }

  const bomData = analysisResult.bom_data;

  // Save BOM items
  if (bomData.components && bomData.components.length > 0) {
    const bomItems = bomData.components.map((component: BOMComponent) => ({
      schematic_id: schematicId,
      component_type: component.component_type,
      value: component.value,
      quantity: component.quantity,
      reference_designators: component.reference_designators || [],
      part_number: component.part_number || null,
      supplier: component.supplier || null,
      supplier_url: component.supplier_url || null,
      confidence: component.confidence || null,
      verified: component.verified || false,
      notes: component.notes || null,
      package: (component as BOMComponent & { package?: string }).package || null,
      material: (component as BOMComponent & { material?: string }).material || null,
    }));

    const { error: bomError } = await supabase.from('bom_items').insert(bomItems);
    if (bomError) {
      console.error('Error saving BOM items:', bomError);
    }
  }

  // Save enclosure recommendation
  if (bomData.enclosure) {
    const { error: enclosureError } = await supabase
      .from('enclosure_recommendations')
      .insert({
        schematic_id: schematicId,
        size: bomData.enclosure.size,
        drill_count: bomData.enclosure.drill_count || null,
        notes: bomData.enclosure.notes || null,
      });
    if (enclosureError) {
      console.error('Error saving enclosure recommendation:', enclosureError);
    }
  }

  // Save power requirements
  if (bomData.power) {
    const { error: powerError } = await supabase
      .from('power_requirements')
      .insert({
        schematic_id: schematicId,
        voltage: bomData.power.voltage,
        current: bomData.power.current || null,
        polarity: bomData.power.polarity,
      });
    if (powerError) {
      console.error('Error saving power requirements:', powerError);
    }
  }

  // Mark schematic complete
  await supabase
    .from('schematics')
    .update({
      processing_status: 'completed',
      ai_confidence_score: Math.round(bomData.confidence_score),
    })
    .eq('id', schematicId);

  // Update project status
  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'in_progress' })
    .eq('id', projectId);
  if (projectUpdateError) {
    console.error('Warning: project status update failed:', projectUpdateError);
  }
}

// ---------------------------------------------------------------------------
// processSchematic — kept for backward compatibility; calls phase 1 + phase 2
// ---------------------------------------------------------------------------

/**
 * Process a schematic file end-to-end:
 * 1. Upload to storage
 * 2. Create schematic record
 * 3. Analyze with Claude Vision
 * 4. Save BOM data to database
 * 5. Update project
 */
export async function processSchematic(
  projectId: string,
  file: File,
  userId: string
): Promise<ProcessSchematicResult> {
  try {
    const prepared = await prepareSchematic(projectId, file, userId);
    await analyzeSchematic(prepared.schematicId, prepared.imageBase64, prepared.imageType, userId);

    // Re-fetch BOM data for the return value
    const bomData = await getBOMData(prepared.schematicId);
    return {
      success: true,
      schematicId: prepared.schematicId,
      bomData: bomData ?? undefined,
    };
  } catch (error) {
    console.error('Error processing schematic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get BOM data for a schematic
 */
export async function getBOMData(schematicId: string): Promise<BOMData | null> {
  try {
    // Fetch BOM items
    const { data: bomItems, error: bomError } = await supabase
      .from('bom_items')
      .select('*')
      .eq('schematic_id', schematicId)
      .order('component_type', { ascending: true });

    if (bomError) {
      console.error('Error fetching BOM items:', bomError);
      return null;
    }

    // Fetch enclosure recommendation
    const { data: enclosure } = await supabase
      .from('enclosure_recommendations')
      .select('*')
      .eq('schematic_id', schematicId)
      .single();

    // Fetch power requirements
    const { data: power } = await supabase
      .from('power_requirements')
      .select('*')
      .eq('schematic_id', schematicId)
      .single();

    // Convert to BOMData format
    const components: BOMComponent[] = bomItems.map(item => ({
      id: item.id,
      component_type: item.component_type,
      value: item.value,
      quantity: item.quantity,
      reference_designators: item.reference_designators || [],
      part_number: item.part_number || undefined,
      supplier: item.supplier || undefined,
      supplier_url: item.supplier_url || undefined,
      confidence: item.confidence || undefined,
      verified: item.verified,
      notes: item.notes || undefined,
    }));

    // Calculate average confidence score
    const confidenceScores = components
      .filter(c => c.confidence !== undefined)
      .map(c => c.confidence!);
    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0;

    return {
      components,
      enclosure: enclosure ? {
        size: enclosure.size,
        drill_count: enclosure.drill_count || 0,
        notes: enclosure.notes || undefined,
      } : undefined,
      power: power ? {
        voltage: power.voltage,
        current: power.current || undefined,
        polarity: power.polarity,
      } : undefined,
      parsed_at: new Date(),
      confidence_score: Math.round(avgConfidence),
    };

  } catch (error) {
    console.error('Error getting BOM data:', error);
    return null;
  }
}

export interface ComponentCorrection {
  componentId?: string;
  schematicId?: string;
  componentType: string;
  reportedValue: string;
  correctValue?: string;
  correctedType?: string;
  originalRef?: string;
  circuitName?: string;
  issueType: 'wrong_value' | 'wrong_type' | 'missing' | 'extra' | 'other';
  description?: string;
}

/**
 * Submit a batch of user-flagged component corrections.
 * Inserts into component_corrections table for AI training purposes.
 */
export async function submitComponentCorrections(
  corrections: ComponentCorrection[]
): Promise<boolean> {
  if (corrections.length === 0) return true;
  try {
    const rows = corrections.map((c) => ({
      schematic_id: c.schematicId || null,
      component_id: c.componentId || null,
      component_type: c.componentType,
      reported_value: c.reportedValue,
      correct_value: c.correctValue || null,
      corrected_type: c.correctedType || null,
      original_ref: c.originalRef || null,
      circuit_name: c.circuitName || null,
      issue_type: c.issueType,
      description: c.description || null,
    }));

    const { error } = await supabase
      .from('component_corrections')
      .insert(rows);

    if (error) {
      console.error('Error submitting corrections:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in submitComponentCorrections:', error);
    return false;
  }
}

/**
 * Update a BOM component (user verification/correction)
 */
export async function updateBOMComponent(
  componentId: string,
  updates: Partial<BOMComponent>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bom_items')
      .update({
        value: updates.value,
        quantity: updates.quantity,
        reference_designators: updates.reference_designators,
        part_number: updates.part_number || null,
        supplier: updates.supplier || null,
        supplier_url: updates.supplier_url || null,
        verified: updates.verified,
        notes: updates.notes || null,
      })
      .eq('id', componentId);

    if (error) {
      console.error('Error updating BOM component:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateBOMComponent:', error);
    return false;
  }
}
