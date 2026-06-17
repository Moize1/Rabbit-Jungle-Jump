export type GameMode = "menu" | "countdown" | "playing" | "gameover" | "leaderboard" | "instructions";

export interface LeaderboardEntry {
  username: string;
  score: number;
  coins: number;
  timeSeconds: number;
  date: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facing: "left" | "right";
  jumpCount: number;
  angle: number; // For cute rotational animation
  blinkTimer: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "ground" | "wooden_bar" | "moss_log" | "leafy";
  hasVines: boolean;
  swayAmount: number;
  swaySpeed: number;
  swayOffset: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "spike_floor" | "wood_spike" | "swinging_ivy" | "wasp" | "falling_log";
  animOffset: number;
  vx?: number;
  vy?: number;
  baseX?: number;
  baseY?: number;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  pulseOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: "sparkle" | "smoke" | "leaf" | "dust" | "text";
  text?: string;
}

export interface BackgroundElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: "cloud" | "leaf" | "butterfly" | "firefly" | "sunray";
  color: string;
  animOffset: number;
}

export interface Booster {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  pulseOffset: number;
}
