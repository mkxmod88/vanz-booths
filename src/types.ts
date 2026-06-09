/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PhotoStripLayout = 'vertical-strip' | 'grid-2x2' | 'landscape-double' | 'solo-studio';

export type FilterType = 
  | 'none' 
  | 'rose-gold' 
  | 'monaco-noir' 
  | 'cyberpunk' 
  | 'vhs-1994' 
  | 'cream-glow' 
  | 'cinema-teal'
  | 'custom-pro';

export interface BgTemplate {
  id: string;
  name: string;
  url?: string;
  color?: string; // fallback or solid color
  description: string;
  icon: string;
}

export interface Sticker {
  id: string;
  emoji: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  scale: number;
  rotation: number; // degrees
}

export interface CapturedPhoto {
  id: string;
  timestamp: string;
  imageSrc: string; // High-resolution dataURL of compiled strip (4K ready)
  frames: string[]; // High-resolution original frames
  layout: PhotoStripLayout;
  filter: FilterType;
  bannerText: string;
  borderColor: string;
  stickers: Sticker[];
}

export interface ProCameraSettings {
  brightness: number; // 50 to 180 (default 100)
  contrast: number;   // 50 to 180 (default 100)
  warmth: number;     // 0 to 50 (sepias/rotates: default 0)
  saturation: number; // 0 to 200 (default 100)
  iso: number;        // 100 to 3200 (default 100). Higher iso simulates digital gain & analog noise!
  sharpness: number;  // 0 to 100 (blur/sharpness, default 0)
  voiceTrigger: boolean; // voice activation toggle
  voiceThreshold: number; // voice sensitivity decibels (1-100)
  chromaKey: boolean;    // Chroma background removal toggle
  chromaColor: string;   // chroma color to key-out (Hex, default "#00ff00")
  chromaTolerance: number; // Tolerance for chroma detection (1-100)
  selectedBgId: string;  // Background template selected
}

export interface FrameSettings {
  borderSize: number;       // Frame width in pixels (0 to 60)
  borderColor: string;      // RGB or Hex
  label: string;            // Text banner at the bottom
  fontStyle: 'sans' | 'mono' | 'serif';
  fontColor: string;        // hex
  cardStyle: 'flat' | 'gold-lining' | 'cyber-neon' | 'polaroid' | 'wood-grain';
  accentLining: boolean;
}

export const BG_TEMPLATES: BgTemplate[] = [
  { id: 'solid-pink', name: 'Barbie Pastel', color: '#ffb3ba', description: 'Solid pastel pink background overlay', icon: '🌸' },
  { id: 'solid-cyan', name: 'Cool Cyan', color: '#baffc9', description: 'Fresh minty teal solid background', icon: '🌿' },
  { id: 'solid-dark', name: 'Studio Obsidian', color: '#111827', description: 'Sleek luxury black studio backing', icon: '🌑' },
  { id: 'marble', name: 'Grand Marble Palace', color: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #e0e0e0 100%)', description: 'Luxury royal marble texture', icon: '🏛️' },
  { id: 'cyber-neon', name: 'Club Cyberpunk', color: 'linear-gradient(45deg, #0f172a 0%, #1e1b4b 60%, #311042 100%)', description: 'Retro techno lounge vibes', icon: '🔮' },
  { id: 'gold-sparkle', name: 'Glitz & Glam Gold', color: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)', description: 'Luxury gold metallic shiny sparkle', icon: '✨' },
  { id: 'earty-wood', name: 'Warm Oak Cabin', color: 'linear-gradient(to right, #78350f, #451a03)', description: 'Rustic wooden plank textures', icon: '🪵' },
  { id: 'cosmic', name: 'Aura Deep Space', color: 'linear-gradient(225deg, #1e1b4b 0%, #311042 33%, #020617 100%)', description: 'Magical space nebula background', icon: '🌌' }
];

export const AUDIO_SHUTTER_SOUNDS = {
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // high quality camera sound or tick
  shutter: 'https://assets.mixkit.co/active_storage/sfx/1657/1657-84.wav' // snapshot camera shutter sound
};
