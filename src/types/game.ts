export type CarId = 'sport' | 'muscle' | 'cyber' | 'phantom';

export interface CarConfig {
  id: CarId;
  name: string;
  tagline: string;
  category: string;
  accentColor: string; // default hex
  availableColors: string[];
  stats: {
    topSpeed: number; // KM/H base
    acceleration: number; // 1-10
    handling: number; // 1-10
    nitroEfficiency: number; // 1-10
  };
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
}

export type EnvironmentId = 'tokyo_night' | 'sunset_coast' | 'cyber_matrix';

export interface EnvironmentConfig {
  id: EnvironmentId;
  name: string;
  subtitle: string;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  roadColor: number;
  roadLineColor: number;
  barrierColor: number;
  buildingLightColors: number[];
  ambientColor: number;
  dirLightColor: number;
  imageBg?: string;
}

export type CameraViewMode = 'chase' | 'far' | 'hood';

export interface GameStats {
  speed: number;
  score: number;
  highScore: number;
  distance: number; // in meters
  nitro: number; // 0-100
  multiplier: number;
  nearMisses: number;
  coinsCollected: number;
  nitroUsedCount: number;
  maxSpeedReached: number;
  isInvulnerable: boolean;
  invulnerableTimeRemaining: number;
}

export interface NearMissAlert {
  id: number;
  text: string;
  points: number;
  timestamp: number;
}

export interface HighScoreRecord {
  id: string;
  date: string;
  carId: CarId;
  score: number;
  distance: number;
  maxSpeed: number;
  environment: EnvironmentId;
}
