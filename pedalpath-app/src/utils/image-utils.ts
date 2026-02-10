/**
 * Image utility functions for compression and PDF conversion
 */

/**
 * Compress an image file to reduce size while maintaining quality for schematic analysis
 * Target: Max 1MB for mobile optimization
 */
export async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions to stay under target size
        // Start with original dimensions, then scale down if needed
        const maxDimension = 2048; // Max dimension for schematics

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with progressive quality reduction until under target size
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const targetSizeBytes = maxSizeMB * 1024 * 1024;

              // If under target size or quality is already very low, use this result
              if (blob.size <= targetSizeBytes || quality <= 0.5) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Try again with lower quality
                tryCompress(quality - 0.1);
              }
            },
            'image/jpeg',
            quality
          );
        };

        // Start with high quality
        tryCompress(0.92);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert PDF to image (first page)
 * Uses PDF.js library loaded via CDN
 */
export async function convertPDFToImage(file: File): Promise<File> {
  // Dynamically import PDF.js if not already loaded
  if (typeof window === 'undefined') {
    throw new Error('PDF conversion only works in browser');
  }

  // Load PDF.js from CDN if not already loaded
  if (!(window as any).pdfjsLib) {
    await loadPDFjs();
  }

  const pdfjsLib = (window as any).pdfjsLib;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        // Get first page
        const page = await pdf.getPage(1);

        // Set scale for good quality (2x for high DPI)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (!context) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert PDF to image'));
              return;
            }

            // Create new File from blob
            const imageFile = new File(
              [blob],
              file.name.replace('.pdf', '.jpg'),
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve(imageFile);
          },
          'image/jpeg',
          0.95
        );
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Load PDF.js library from CDN
 */
async function loadPDFjs(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).pdfjsLib) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      // Set worker path
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

/**
 * Process file before upload: compress if image, convert if PDF
 */
export async function prepareFileForUpload(file: File): Promise<{
  file: File;
  wasCompressed: boolean;
  wasConverted: boolean;
  originalSize: number;
  finalSize: number;
}> {
  const originalSize = file.size;
  let processedFile = file;
  let wasCompressed = false;
  let wasConverted = false;

  try {
    // Convert PDF to image first
    if (file.type === 'application/pdf') {
      processedFile = await convertPDFToImage(file);
      wasConverted = true;
    }

    // Compress image if over 1MB
    if (processedFile.size > 1024 * 1024) {
      processedFile = await compressImage(processedFile, 1);
      wasCompressed = true;
    }

    return {
      file: processedFile,
      wasCompressed,
      wasConverted,
      originalSize,
      finalSize: processedFile.size,
    };
  } catch (error) {
    console.error('Error preparing file for upload:', error);
    // If processing fails, return original file
    return {
      file,
      wasCompressed: false,
      wasConverted: false,
      originalSize,
      finalSize: file.size,
    };
  }
}
