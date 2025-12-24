
export enum AppState {
  SPLASH = 'SPLASH',
  MAIN = 'MAIN'
}

export enum ParticleMode {
  TREE = 'TREE',
  IMAGE = 'IMAGE'
}

export interface AppConfig {
  particleColor: string;
  rotationSpeed: number;
  lightIntensity: number;
  particleCount: number;
  treeHeight: number;
  treeWidth: number;
  particleSize: number;
  bloomIntensity: number;
}

export interface ImageData {
  id: string;
  url: string;
  pixels: Float32Array; // Flattened RGBA data for 100x100
}

/**
 * Data structure for hand tracking updates
 */
export interface HandData {
  gesture: 'FIST' | 'OPEN' | 'PINCH' | 'NONE';
  x: number;
  y: number;
  isDetected: boolean;
}
