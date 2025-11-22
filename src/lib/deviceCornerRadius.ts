/**
 * Device Corner Radius Detection
 * Maps iPhone models to their screen corner radii
 * 
 * Note: Values are in pixels for CSS border-radius
 * Based on research, but may need adjustment based on actual device testing
 */

import { Device } from '@capacitor/device';

// Map of device model identifiers to corner radii (in pixels)
// These values are approximate and may need adjustment
const DEVICE_CORNER_RADIUS_MAP: Record<string, number> = {
  // iPhone X, Xs, Xs Max, 11 Pro, 11 Pro Max
  'iPhone10,3': 39, // iPhone X
  'iPhone10,6': 39, // iPhone X
  'iPhone11,2': 39, // iPhone Xs
  'iPhone11,4': 39, // iPhone Xs Max
  'iPhone11,6': 39, // iPhone Xs Max
  'iPhone12,1': 39, // iPhone 11
  'iPhone12,3': 39, // iPhone 11 Pro
  'iPhone12,5': 39, // iPhone 11 Pro Max
  
  // iPhone 12 mini, 13 mini
  'iPhone13,1': 44, // iPhone 12 mini
  'iPhone14,4': 44, // iPhone 13 mini
  
  // iPhone 12, 12 Pro, 13 Pro, 14
  'iPhone13,2': 47, // iPhone 12
  'iPhone13,3': 47, // iPhone 12 Pro
  'iPhone14,2': 47, // iPhone 13 Pro
  'iPhone14,7': 47, // iPhone 14
  
  // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  'iPhone13,4': 53, // iPhone 12 Pro Max
  'iPhone14,3': 53, // iPhone 13 Pro Max
  'iPhone14,8': 53, // iPhone 14 Plus
  
  // iPhone 14 Pro, 14 Pro Max
  'iPhone15,2': 55, // iPhone 14 Pro
  'iPhone15,3': 55, // iPhone 14 Pro Max
  
  // iPhone 15 series (estimated, may need adjustment)
  'iPhone15,4': 55, // iPhone 15
  'iPhone15,5': 55, // iPhone 15 Plus
  'iPhone16,1': 55, // iPhone 15 Pro
  'iPhone16,2': 55, // iPhone 15 Pro Max
};

let cachedCornerRadius: number | null = null;

/**
 * Get the screen corner radius for the current device
 * Returns a cached value after first call
 */
export async function getDeviceCornerRadius(): Promise<number> {
  // Return cached value if available
  if (cachedCornerRadius !== null) {
    return cachedCornerRadius;
  }

  try {
    // Check if we're in a Capacitor environment
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const deviceInfo = await Device.getInfo();
      
      // Try to match device model
      const model = deviceInfo.model;
      const identifier = deviceInfo.modelId || model;
      
      console.log('📱 Device detection:', { model, identifier, platform: deviceInfo.platform });
      
      // Look up corner radius by model identifier
      if (identifier && DEVICE_CORNER_RADIUS_MAP[identifier]) {
        cachedCornerRadius = DEVICE_CORNER_RADIUS_MAP[identifier];
        console.log('✅ Found corner radius for device:', identifier, '=', cachedCornerRadius, 'px');
        return cachedCornerRadius;
      }
      
      // Fallback: try to match by model name (less reliable)
      const modelLower = model.toLowerCase();
      if (modelLower.includes('iphone')) {
        // Try to extract model number from model string
        // This is a fallback and may not be accurate
        if (modelLower.includes('mini')) {
          cachedCornerRadius = 44;
        } else if (modelLower.includes('pro max') || modelLower.includes('plus')) {
          cachedCornerRadius = 55; // Use higher value for larger devices
        } else if (modelLower.includes('pro')) {
          cachedCornerRadius = 55;
        } else {
          cachedCornerRadius = 47; // Default for regular iPhones
        }
        console.log('⚠️ Using fallback corner radius based on model name:', cachedCornerRadius, 'px');
        return cachedCornerRadius;
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to detect device corner radius:', error);
  }

  // Final fallback: use 45px (confirmed working value)
  cachedCornerRadius = 45;
  console.log('📐 Using default corner radius:', cachedCornerRadius, 'px');
  return cachedCornerRadius;
}

/**
 * Get corner radius synchronously (returns cached value or default)
 * Use this in components that can't be async
 */
export function getCornerRadiusSync(): number {
  return cachedCornerRadius ?? 45; // Default to 45px if not yet detected
}

