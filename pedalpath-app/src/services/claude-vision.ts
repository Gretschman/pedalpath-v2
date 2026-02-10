import type {
  SchematicAnalysisRequest,
  SchematicAnalysisResponse,
  BOMComponent,
} from '../types/bom.types';

const API_TIMEOUT = 60000; // 60 seconds for AI analysis
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again with a clearer image or smaller file.');
    }
    throw error;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, response?: Response): boolean {
  // Don't retry client errors (4xx)
  if (response && response.status >= 400 && response.status < 500) {
    return false;
  }

  // Retry on network errors or server errors (5xx)
  if (!response || response.status >= 500) {
    return true;
  }

  // Retry on timeout
  if (error instanceof Error && error.message.includes('timed out')) {
    return true;
  }

  return false;
}

/**
 * Analyze a schematic image using Claude Vision API via backend with retry logic
 */
export async function analyzeSchematic(
  request: SchematicAnalysisRequest,
  retryCount: number = 0
): Promise<SchematicAnalysisResponse> {
  try {
    // Determine API URL based on environment
    const apiUrl = window.location.hostname === 'localhost'
      ? '/api/analyze-schematic' // Will be proxied by Vite in dev
      : '/api/analyze-schematic'; // Vercel serverless function in production

    // Call our backend API with timeout
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      API_TIMEOUT
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `Analysis failed: ${response.statusText}`);

      // Check if we should retry
      if (retryCount < MAX_RETRIES && isRetryableError(error, response)) {
        console.log(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAYS[retryCount]);
        return analyzeSchematic(request, retryCount + 1);
      }

      throw error;
    }

    return await response.json();

  } catch (error) {
    console.error('Error analyzing schematic:', error);

    // Check if we should retry
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      console.log(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await sleep(RETRY_DELAYS[retryCount]);
      return analyzeSchematic(request, retryCount + 1);
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: `Analysis failed: ${error.message}${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`,
      };
    }

    return {
      success: false,
      error: 'An unknown error occurred during schematic analysis.',
    };
  }
}

/**
 * Convert a File or Blob to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze a schematic file
 */
export async function analyzeSchematicFile(file: File): Promise<SchematicAnalysisResponse> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);

    // Determine media type
    let mediaType: SchematicAnalysisRequest['image_type'];
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      mediaType = 'image/jpeg';
    } else if (file.type === 'image/png') {
      mediaType = 'image/png';
    } else if (file.type === 'image/webp') {
      mediaType = 'image/webp';
    } else if (file.type === 'image/gif') {
      mediaType = 'image/gif';
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WEBP, GIF`);
    }

    // Analyze with Claude Vision
    return await analyzeSchematic({
      image_base64: base64Data,
      image_type: mediaType,
    });

  } catch (error) {
    console.error('Error analyzing schematic file:', error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to process schematic file.',
    };
  }
}

/**
 * Calculate estimated total cost for BOM
 * This is a rough estimate based on typical component prices
 */
export function estimateBOMCost(components: BOMComponent[]): number {
  const prices: Record<string, number> = {
    resistor: 0.05,
    capacitor: 0.15,
    diode: 0.20,
    transistor: 0.50,
    ic: 2.00,
    'op-amp': 1.50,
    'input-jack': 1.50,
    'output-jack': 1.50,
    'dc-jack': 1.00,
    footswitch: 4.00,
    potentiometer: 2.00,
    led: 0.25,
    switch: 1.50,
    other: 0.50,
  };

  return components.reduce((total, component) => {
    const unitPrice = prices[component.component_type] || 0.50;
    return total + (unitPrice * component.quantity);
  }, 0);
}
