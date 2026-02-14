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
    // Step 0: Detect actual file type from content (don't trust file extension)
    // This handles cases where files are misnamed (e.g., JPEG with .gif extension)
    const actualMimeType = await detectImageType(file);
    console.log(`File: ${file.name}, Declared type: ${file.type}, Actual type: ${actualMimeType}`);

    // Create a new File object with the correct mime type if it differs
    let fileToUpload = file;
    if (actualMimeType !== file.type) {
      console.log(`Correcting mime type from ${file.type} to ${actualMimeType}`);
      fileToUpload = new File([file], file.name, { type: actualMimeType });
    }

    // Step 1: Upload file to storage
    const uploadResult = await uploadSchematic(userId, fileToUpload, projectId);
    if (!uploadResult) {
      return {
        success: false,
        error: 'Failed to upload schematic file',
      };
    }

    // Step 2: Create schematic record in database
    const { data: schematic, error: schematicError } = await supabase
      .from('schematics')
      .insert({
        project_id: projectId,
        storage_path: uploadResult.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: actualMimeType, // Use detected mime type, not declared
        processing_status: 'processing',
      })
      .select()
      .single();

    if (schematicError || !schematic) {
      console.error('Error creating schematic record:', schematicError);
      return {
        success: false,
        error: 'Failed to create schematic record',
      };
    }

    // Step 3: Analyze schematic with Claude Vision (use corrected file)
    const analysisResult = await analyzeSchematicFile(fileToUpload);

    if (!analysisResult.success || !analysisResult.bom_data) {
      // Update schematic status to failed
      await supabase
        .from('schematics')
        .update({
          processing_status: 'failed',
          processing_error: analysisResult.error || 'Analysis failed',
        })
        .eq('id', schematic.id);

      return {
        success: false,
        error: analysisResult.error || 'Failed to analyze schematic',
        schematicId: schematic.id,
      };
    }

    const bomData = analysisResult.bom_data;

    // Step 4: Save BOM data to database

    // 4a. Save BOM items
    if (bomData.components && bomData.components.length > 0) {
      const bomItems = bomData.components.map((component: BOMComponent) => ({
        schematic_id: schematic.id,
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
      }));

      const { error: bomError } = await supabase
        .from('bom_items')
        .insert(bomItems);

      if (bomError) {
        console.error('Error saving BOM items:', bomError);
        // Continue anyway - we can still use the data
      }
    }

    // 4b. Save enclosure recommendation
    if (bomData.enclosure) {
      const { error: enclosureError } = await supabase
        .from('enclosure_recommendations')
        .insert({
          schematic_id: schematic.id,
          size: bomData.enclosure.size,
          drill_count: bomData.enclosure.drill_count || null,
          notes: bomData.enclosure.notes || null,
        });

      if (enclosureError) {
        console.error('Error saving enclosure recommendation:', enclosureError);
      }
    }

    // 4c. Save power requirements
    if (bomData.power) {
      const { error: powerError } = await supabase
        .from('power_requirements')
        .insert({
          schematic_id: schematic.id,
          voltage: bomData.power.voltage,
          current: bomData.power.current || null,
          polarity: bomData.power.polarity,
        });

      if (powerError) {
        console.error('Error saving power requirements:', powerError);
      }
    }

    // Step 5: Update schematic status to completed
    await supabase
      .from('schematics')
      .update({
        processing_status: 'completed',
        ai_confidence_score: Math.round(bomData.confidence_score),
      })
      .eq('id', schematic.id);

    // Step 6: Update project with schematic URL and component count
    await supabase
      .from('projects')
      .update({
        schematic_url: uploadResult.url,
        status: 'in_progress',
      })
      .eq('id', projectId);

    return {
      success: true,
      schematicId: schematic.id,
      bomData,
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
