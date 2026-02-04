import { supabase } from './supabase';

/**
 * Upload a schematic file to Supabase Storage
 */
export async function uploadSchematic(
  userId: string,
  file: File,
  _projectId?: string
): Promise<{ path: string; url: string } | null> {
  try {
    // Generate a unique file name
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('schematics')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading schematic:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('schematics')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error in uploadSchematic:', error);
    return null;
  }
}

/**
 * Delete a schematic file from Supabase Storage
 */
export async function deleteSchematic(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('schematics')
      .remove([path]);

    if (error) {
      console.error('Error deleting schematic:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSchematic:', error);
    return false;
  }
}

/**
 * Get a signed URL for a private schematic
 */
export async function getSchematicSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('schematics')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSchematicSignedUrl:', error);
    return null;
  }
}

/**
 * Initialize storage bucket (one-time setup)
 * This should be run once to create the schematics bucket
 */
export async function initializeStorageBucket(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();

    const bucketExists = buckets?.some(bucket => bucket.name === 'schematics');

    if (bucketExists) {
      console.log('Schematics bucket already exists');
      return true;
    }

    // Create bucket if it doesn't exist
    const { error } = await supabase.storage.createBucket('schematics', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    });

    if (error) {
      console.error('Error creating schematics bucket:', error);
      return false;
    }

    console.log('Schematics bucket created successfully');
    return true;
  } catch (error) {
    console.error('Error in initializeStorageBucket:', error);
    return false;
  }
}
