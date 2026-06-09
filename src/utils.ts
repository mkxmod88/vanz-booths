/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProCameraSettings, FrameSettings, Sticker, PhotoStripLayout, FilterType, BG_TEMPLATES } from './types';

/**
 * Hex to RGB helper
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 255, b: 0 };
}

/**
 * Apply filters, ISO grain, brightness, contrast, saturations on a frame canvas
 */
export function applyProFiltersAndGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: ProCameraSettings,
  filterType: FilterType
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Pro Settings controls
  const fContrast = settings.contrast / 100;
  const fBrightness = settings.brightness / 100;
  const fSaturation = settings.saturation / 100;
  const fWarmth = settings.warmth; // 0 (neutral) to 50 (warm amber)

  // 2. Grain settings based on Simulated ISO
  // ISO 100 = minimal noise, ISO 3200 = heavy rich film grain
  const isoFactor = (settings.iso - 100) / 3100; // normalized 0.0 to 1.0
  const grainStrength = isoFactor * 35; // Maximum noise strength at ISO 3200

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // --- BRIGHTNESS & CONTRAST ---
    // Apply brightness
    r = r * fBrightness;
    g = g * fBrightness;
    b = b * fBrightness;

    // Apply contrast
    r = (r - 128) * fContrast + 128;
    g = (g - 128) * fContrast + 128;
    b = (b - 128) * fContrast + 128;

    // --- SATURATION & WARMTH ---
    // Desaturate / Saturate (Luminance formula)
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    r = luma + (r - luma) * fSaturation;
    g = luma + (g - luma) * fSaturation;
    b = luma + (b - luma) * fSaturation;

    // White Balance Warmth (amber shift)
    if (fWarmth > 0) {
      r += fWarmth * 0.8;
      g += fWarmth * 0.3;
      b -= fWarmth * 0.5;
    }

    // --- APPLY PRESET FILTER CHARACTERISTICS ---
    if (filterType === 'rose-gold') {
      r = r * 1.15 + 10;
      g = g * 0.95 + 4;
      b = b * 1.05 + 8;
    } else if (filterType === 'monaco-noir') {
      const avg = 0.3 * r + 0.59 * g + 0.11 * b;
      // Boost highlights and crush deep black shades
      const contrastMonaco = (avg - 128) * 1.35 + 128;
      r = contrastMonaco + 10;
      g = contrastMonaco + 6;
      b = contrastMonaco;
    } else if (filterType === 'cyberpunk') {
      // Split tones: Magenta Highlights & Cyan Shadows
      const luminance = (r + g + b) / 3;
      if (luminance > 120) {
        r = r * 1.25;
        g = g * 0.8;
        b = b * 1.3; // Pink highlights
      } else {
        r = r * 0.6;
        g = g * 1.15;
        b = b * 1.35; // Cyan shadows
      }
    } else if (filterType === 'vhs-1994') {
      // Chromatic tint shift & faded blacks
      r = r * 0.9 + 20;
      g = g * 1.05 + 10;
      b = b * 1.25;
    } else if (filterType === 'cream-glow') {
      // Cream tint with high brightness
      r = r * 1.05 + 15;
      g = g * 1.02 + 10;
      b = b * 0.92 + 5;
    } else if (filterType === 'cinema-teal') {
      // Cinematic teal shadow offset
      r = r * 0.85;
      g = g * 1.05;
      b = b * 1.1;
    }

    // --- SIMULATED COMPACT ISO FILM GRAIN ---
    if (grainStrength > 0) {
      const noise = (Math.random() - 0.5) * grainStrength;
      r += noise;
      g += noise;
      b += noise;
    }

    // Clamp values
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);

  // Apply visual sharpness or glow blur if needed via canvas filter configurations
  if (settings.sharpness > 0) {
    ctx.filter = `contrast(${1 + settings.sharpness / 200})`;
  }
}

/**
 * Remove selected pixel colors to perform live transparent green-screening
 */
export function processChromaKey(
  inputCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  targetHex: string,
  tolerance: number
) {
  const imgData = inputCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const target = hexToRgb(targetHex);

  // Tolerance matches direct vector distance in 3D color cube (RGB space)
  const threshold = (tolerance / 100) * 441; // 441 is max distance in RGB space Math.sqrt(255^2 * 3)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - target.r, 2) + Math.pow(g - target.g, 2) + Math.pow(b - target.b, 2)
    );

    if (dist < threshold) {
      data[i + 3] = 0; // Set transparency alpha channel to 0
    }
  }

  inputCtx.putImageData(imgData, 0, 0);
}

/**
 * Compile Taken Snapshots with Premium Frames, Banners, and Custom Stickers 
 * specifically targeting standard 4K high density pixel resolution.
 */
export async function renderHighFidelityStrip(
  frames: string[], // Captured photo base64 strings
  layout: PhotoStripLayout,
  filter: FilterType,
  frameSettings: FrameSettings,
  proCamera: ProCameraSettings,
  stickers: Sticker[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 4K Target Dimensions: 2400 x 3600 (2:3 Aspect ratio standard layout)
    const cw = 2400;
    const ch = 3600;

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas compilation failed'));
      return;
    }

    // 1. DRAW FRAME BACKGROUND CANVAS (SOLID OR GRADIENT)
    const style = frameSettings.cardStyle;
    ctx.save();
    
    if (style === 'gold-lining') {
      // Draw luxury dark gold textured base
      const gradient = ctx.createLinearGradient(0, 0, cw, ch);
      gradient.addColorStop(0, '#111827'); // dark black-grey
      gradient.addColorStop(0.5, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cw, ch);

      // Gold Elegant Inner Border Accent
      ctx.strokeStyle = '#eab308'; // Amber gold
      ctx.lineWidth = 14;
      ctx.strokeRect(40, 40, cw - 80, ch - 80);
      ctx.strokeStyle = '#ca8a04'; // Dark luxury gold
      ctx.lineWidth = 4;
      ctx.strokeRect(52, 52, cw - 104, ch - 104);
    } else if (style === 'cyber-neon') {
      // Cyber Neon Gradient with neon borders
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, cw, ch);

      const grad = ctx.createLinearGradient(0, 0, cw, ch);
      grad.addColorStop(0, '#ec4899'); // Fuchsia
      grad.addColorStop(1, '#3b82f6'); // Electric Blue
      ctx.strokeStyle = grad;
      ctx.lineWidth = 20;
      ctx.strokeRect(30, 30, cw - 60, ch - 60);
    } else if (style === 'wood-grain') {
      // Warm rustic wooden overlay texture
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#2d1405');
      grad.addColorStop(0.5, '#451a03');
      grad.addColorStop(1, '#1c0c03');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      ctx.strokeStyle = '#d97706'; // Wood amber shine
      ctx.lineWidth = 6;
      ctx.strokeRect(45, 45, cw - 90, ch - 90);
    } else if (style === 'polaroid') {
      // Elegant high-class Polaroid card style
      ctx.fillStyle = '#f8fafc'; // Crisp off-white polaroid card
      ctx.fillRect(0, 0, cw, ch);
      
      // subtle border shadows
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, cw - 20, ch - 20);
    } else {
      // Flat Custom Color
      ctx.fillStyle = frameSettings.borderColor;
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.restore();

    // 2. POSITION FRAMES DYNAMICALLY UNDER COMPILING FRAME
    const borderSize = frameSettings.borderSize * 3; // scaled up to 4K sizes
    const bannerHeight = 440; // Reserved area for text banner at very bottom

    /**
     * Map image load helpers to draw slices of frame buffers
     */
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = (e) => rej(e);
        img.src = src;
      });
    };

    Promise.all(frames.map(loadImage))
      .then((loadedImages) => {
        const count = loadedImages.length;
        ctx.save();

        if (layout === 'vertical-strip') {
          // Classic 4 panel vertically stacked
          const frameCount = 4;
          const availableHeight = ch - bannerHeight - 160; // offset padding
          const slotH = availableHeight / frameCount;
          const leftPad = 150 + borderSize;
          const rightPad = 150 + borderSize;
          const slotW = cw - leftPad - rightPad;

          for (let i = 0; i < frameCount; i++) {
            const img = loadedImages[i % count]; // wrap if fewer screenshots
            if (!img) continue;

            const slotY = 100 + i * slotH + borderSize;
            const drawH = slotH - borderSize * 2;
            const drawW = slotW;

            // Compute center cropping of frame to cover the slot
            const imgRatio = img.width / img.height;
            const slotRatio = drawW / drawH;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;

            if (imgRatio > slotRatio) {
              sw = img.height * slotRatio;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / slotRatio;
              sy = (img.height - sh) / 2;
            }

            // Draw image slot
            ctx.drawImage(img, sx, sy, sw, sh, leftPad, slotY, drawW, drawH);

            // Draw micro frame border around slot
            if (frameSettings.accentLining) {
              ctx.strokeStyle = style === 'gold-lining' ? '#ca8a04' : '#e2e8f0';
              ctx.lineWidth = 10;
              ctx.strokeRect(leftPad, slotY, drawW, drawH);
            }
          }
        } 
        else if (layout === 'grid-2x2') {
          // 4 Quad Grid (2 columns, 2 rows)
          const padX = 140 + borderSize;
          const padTop = 160 + borderSize;
          const availW = cw - padX * 2;
          const availH = ch - bannerHeight - padTop;

          const cellW = availW / 2 - borderSize;
          const cellH = availH / 2 - borderSize;

          const coordinates = [
            { x: padX, y: padTop },
            { x: padX + cellW + borderSize * 2, y: padTop },
            { x: padX, y: padTop + cellH + borderSize * 2 },
            { x: padX + cellW + borderSize * 2, y: padTop + cellH + borderSize * 2 }
          ];

          for (let i = 0; i < 4; i++) {
            const img = loadedImages[i % count];
            if (!img) continue;

            const coord = coordinates[i];
            const drawW = cellW;
            const drawH = cellH;

            // Center crop formula
            const imgRatio = img.width / img.height;
            const targetRatio = drawW / drawH;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;

            if (imgRatio > targetRatio) {
              sw = img.height * targetRatio;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / targetRatio;
              sy = (img.height - sh) / 2;
            }

            ctx.drawImage(img, sx, sy, sw, sh, coord.x, coord.y, drawW, drawH);

            if (frameSettings.accentLining) {
              ctx.strokeStyle = frameSettings.cardStyle === 'gold-lining' ? '#eab308' : '#cbd5e1';
              ctx.lineWidth = 8;
              ctx.strokeRect(coord.x, coord.y, drawW, drawH);
            }
          }
        } 
        else if (layout === 'landscape-double') {
          // 2 Portrait Images placed side-by-side
          const padX = 140 + borderSize;
          const padTop = 320 + borderSize;
          const availW = cw - padX * 2;
          const drawH = ch - bannerHeight - padTop - 200;
          const drawW = availW / 2 - borderSize * 2;

          for (let i = 0; i < 2; i++) {
            const img = loadedImages[i % count];
            if (!img) continue;

            const itemX = padX + i * (drawW + borderSize * 4);
            
            // Center crop
            const imgRatio = img.width / img.height;
            const targetRatio = drawW / drawH;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;

            if (imgRatio > targetRatio) {
              sw = img.height * targetRatio;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / targetRatio;
              sy = (img.height - sh) / 2;
            }

            ctx.drawImage(img, sx, sy, sw, sh, itemX, padTop, drawW, drawH);

            if (frameSettings.accentLining) {
              ctx.strokeStyle = style === 'cyber-neon' ? '#3b82f6' : '#e2e8f0';
              ctx.lineWidth = 12;
              ctx.strokeRect(itemX, padTop, drawW, drawH);
            }
          }
        } 
        else {
          // solo-studio: One single beautiful center portrait
          const padX = 180 + borderSize;
          const padY = 220 + borderSize;
          const drawW = cw - padX * 2;
          const drawH = ch - bannerHeight - padY - 100;

          const img = loadedImages[0] || loadedImages[loadedImages.length - 1];
          if (img) {
            // center crop
            const imgRatio = img.width / img.height;
            const targetRatio = drawW / drawH;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;

            if (imgRatio > targetRatio) {
              sw = img.height * targetRatio;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / targetRatio;
              sy = (img.height - sh) / 2;
            }

            ctx.drawImage(img, sx, sy, sw, sh, padX, padY, drawW, drawH);

            if (frameSettings.accentLining) {
              ctx.strokeStyle = style === 'gold-lining' ? '#ca8a04' : '#e2e8f0';
              ctx.lineWidth = 14;
              ctx.strokeRect(padX, padY, drawW, drawH);
            }
          }
        }
        ctx.restore();

        // 3. DRAW TEXT BANNER (Aura Custom Label)
        if (frameSettings.label) {
          ctx.save();
          const textY = ch - 220;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = frameSettings.fontColor;

          // Pick Font Family mapping
          let fontFam = '"Outfit", sans-serif';
          if (frameSettings.fontStyle === 'mono') fontFam = '"JetBrains Mono", monospace';
          if (frameSettings.fontStyle === 'serif') fontFam = '"Playfair Display", serif';

          ctx.font = `600 75px ${fontFam}`;
          ctx.fillText(frameSettings.label.toUpperCase(), cw / 2, textY);

          // Sub banner decoration
          ctx.fillStyle = frameSettings.fontColor + 'AA'; // opaque
          ctx.font = `400 40px "Outfit", sans-serif`;
          ctx.fillText('4K ULTRA HIGH-DEFINITION STUDIO • AURA BOOTH', cw / 2, textY + 80);
          ctx.restore();
        }

        // 4. DRAW STICKERS (Scaled up dynamically on the 4K canvas coordinate space)
        if (stickers && stickers.length > 0) {
          ctx.save();
          for (const sticker of stickers) {
            // sticker x,y coordinates are percentages (0-100) on App canvas coordinate
            const canvasX = (sticker.x / 100) * cw;
            const canvasY = (sticker.y / 100) * ch;
            const size = sticker.scale * 4; // amplified size for 4K display print quality

            ctx.translate(canvasX, canvasY);
            ctx.rotate((sticker.rotation * Math.PI) / 180);
            
            ctx.font = `${size}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sticker.emoji, 0, 0);
            
            // reset translation matrix
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }
          ctx.restore();
        }

        // Output complete, super high quality base64 image slice
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        resolve(dataUrl);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Generate a simulated cloud-stored file ID with high reliability 
 * and render customizable sharing content.
 */
export function generatePhotoID(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `aura-strip-${result}`;
}
