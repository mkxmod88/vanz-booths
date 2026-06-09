/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Columns, Grid, LayoutDashboard, SlidersHorizontal, Type, Sticker as StickerIcon, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, Plus, Minus } from 'lucide-react';
import { PhotoStripLayout, FrameSettings, Sticker } from '../types';

interface FrameCustomizerProps {
  layout: PhotoStripLayout;
  setLayout: (l: PhotoStripLayout) => void;
  frameSettings: FrameSettings;
  setFrameSettings: React.Dispatch<React.SetStateAction<FrameSettings>>;
  stickers: Sticker[];
  setStickers: React.Dispatch<React.SetStateAction<Sticker[]>>;
  selectedStickerId: string | null;
  setSelectedStickerId: (id: string | null) => void;
}

const PRESET_STICKERS = [
  { emoji: '👑', name: 'Royal Crown' },
  { emoji: '✨', name: 'Golden Sparkles' },
  { emoji: '🌟', name: 'Neon Star' },
  { emoji: '😎', name: 'Vintage Shades' },
  { emoji: '🍾', name: 'Champagne Poppin' },
  { emoji: '❤️', name: 'Romantic Heart' },
  { emoji: '🌹', name: 'Luxury Rose' },
  { emoji: '🍿', name: 'Movie Night' },
  { emoji: '📸', name: 'Camera Flash' },
  { emoji: '🥂', name: 'Cozy Cheers' },
  { emoji: '💡', name: 'Studio Spotlight' },
  { emoji: '🔥', name: 'Aura Fire' }
];

const FRAME_BG_PRESETS = [
  { name: 'Onyx Studio', color: '#090d16', desc: 'Dark solid black' },
  { name: 'Chiffon White', color: '#f8fafc', desc: 'Sleek matte white' },
  { name: 'Warm Apricot', color: '#fed7aa', desc: 'Creamy solid pastel' },
  { name: 'Sage Green', color: '#d1fae5', desc: 'Natural soft sage' },
  { name: 'Teal Vintage', color: '#115e59', desc: 'Classic teal studio' },
  { name: 'Crimson Velvet', color: '#991b1b', desc: 'Elegant deep scarlet red' }
];

export default function FrameCustomizer({
  layout,
  setLayout,
  frameSettings,
  setFrameSettings,
  stickers,
  setStickers,
  selectedStickerId,
  setSelectedStickerId
}: FrameCustomizerProps) {

  // Add new sticker to center of the preview strip
  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      emoji,
      x: 50, // center horizontally (percentage)
      y: 40, // center vertically (percentage)
      scale: 30, // initial canvas size
      rotation: 0 // no initial tilt
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  /**
   * Action key helpers to move, rotate, scale selected stickers
   */
  const updateSelectedSticker = (updater: (st: Sticker) => Sticker) => {
    if (!selectedStickerId) return;
    setStickers(prev => prev.map(s => s.id === selectedStickerId ? updater(s) : s));
  };

  const moveSticker = (direction: 'up' | 'down' | 'left' | 'right', amount: number = 3) => {
    updateSelectedSticker(s => {
      let nx = s.x;
      let ny = s.y;
      if (direction === 'up') ny = Math.max(2, s.y - amount);
      if (direction === 'down') ny = Math.min(98, s.y + amount);
      if (direction === 'left') nx = Math.max(2, s.x - amount);
      if (direction === 'right') nx = Math.min(98, s.x + amount);
      return { ...s, x: nx, y: ny };
    });
  };

  const scaleSticker = (factor: 'plus' | 'minus') => {
    updateSelectedSticker(s => {
      const scaleDelta = factor === 'plus' ? 4 : -4;
      return { ...s, scale: Math.min(100, Math.max(12, s.scale + scaleDelta)) };
    });
  };

  const rotateSticker = (direction: 'cw' | 'ccw') => {
    updateSelectedSticker(s => {
      const rotDelta = direction === 'cw' ? 15 : -15;
      return { ...s, rotation: (s.rotation + rotDelta) % 360 };
    });
  };

  const selectedSticker = stickers.find(s => s.id === selectedStickerId);

  return (
    <div className="glass rounded-3xl p-6 shadow-luxe space-y-6 select-none" id="frame-customizer-suite">
      <div>
        <h2 className="font-sans font-semibold text-lg text-white tracking-tight">Desain Frame Studio</h2>
        <p className="font-mono text-[10px] text-white/50 uppercase tracking-wider">MODUL KUSTOMISASI BINGKAI MEWAH & LAYOUT</p>
      </div>

      {/* 1. LAYOUT SELECTOR */}
      <div className="space-y-3">
        <label className="font-sans text-xs font-semibold text-white/90 flex items-center gap-1.5">
          <Columns className="h-3.5 w-3.5 text-gold" />
          Pilih Susunan Foto (Layout)
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: 'vertical-strip', name: 'Classic Strip', desc: '4 Foto Berurutan', icon: Columns },
            { id: 'grid-2x2', name: 'Chic Quad', desc: 'Kotak 2x2 Grid', icon: Grid },
            { id: 'landscape-double', name: 'Golden Duo', desc: 'Dua Foto Berdampingan', icon: LayoutDashboard },
            { id: 'solo-studio', name: 'Solo Studio 4K', desc: 'Potret Tunggal Studio', icon: SlidersHorizontal }
          ].map((l) => {
            const Icon = l.icon;
            const isSelected = layout === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLayout(l.id as PhotoStripLayout)}
                className={`flex items-center gap-3 text-left p-3 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer ${
                  isSelected
                    ? 'bg-gold/15 border-gold text-gold shadow-luxe'
                    : 'glass border-white/5 text-white/50 hover:border-white/15 hover:text-white/80'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-gold' : 'text-white/40'}`} />
                <div>
                  <span className="font-sans font-medium text-xs block">{l.name}</span>
                  <span className="font-mono text-[8.5px] opacity-75 mt-0.5 block">{l.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CARD STYLES */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <label className="font-sans text-xs font-semibold text-white/95 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gold" />
          Gaya Bingkai (Card Style Presets)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'flat', name: 'Satin Minimalist', desc: 'Solid single tone' },
            { id: 'gold-lining', name: 'Royal Gold', desc: 'Embossed black gold lining' },
            { id: 'cyber-neon', name: 'Cyber Neon Glow', desc: 'Fuchsia wave tube' },
            { id: 'polaroid', name: 'Cozy Polaroid', desc: 'Classic off-white base' },
            { id: 'wood-grain', name: 'Warm Oak Wood', desc: 'Rustic log timber feel' }
          ].map((c) => {
            const isSelected = frameSettings.cardStyle === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFrameSettings(s => ({ ...s, cardStyle: c.id as any }))}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gold/15 border-gold text-gold shadow-luxe'
                    : 'glass border-white/5 text-white/50 hover:border-white/15 hover:text-white/80'
                }`}
              >
                <span className="font-sans font-semibold text-[11px] truncate">{c.name}</span>
                <span className="font-mono text-[8.5px] opacity-70 mt-0.5 truncate">{c.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SOLID BORDER OPTIONS (Only if card style is flat or custom) */}
      {frameSettings.cardStyle === 'flat' && (
        <div className="space-y-3 pt-3 border-t border-white/10 animate-fade-in">
          <label className="font-sans text-xs font-semibold text-white/90">
            Warna Satin Bingkai
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              type="color"
              value={frameSettings.borderColor}
              onChange={(e) => setFrameSettings(s => ({ ...s, borderColor: e.target.value }))}
              className="h-9 w-9 p-0 border border-white/20 bg-transparent rounded-lg cursor-pointer shrink-0"
              title="Kustom Warna"
            />
            {FRAME_BG_PRESETS.map((p) => (
              <button
                key={p.color}
                onClick={() => setFrameSettings(s => ({ ...s, borderColor: p.color }))}
                title={p.desc}
                className={`h-9 px-3 rounded-lg border font-sans text-[11px] transition-all cursor-pointer ${
                  frameSettings.borderColor === p.color
                    ? 'border-gold text-gold bg-black/40 shadow-luxe'
                    : 'glass border-white/10 text-white/70 hover:border-white/20'
                }`}
                style={{ borderLeft: `6px solid ${p.color}` }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Frame border sizes & optional line accents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-3 border-t border-white/10">
        <div className="space-y-1.5 font-sans text-xs">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/80">Ketebalan Margin Bingkai</span>
            <span className="text-gold font-mono">{frameSettings.borderSize}px</span>
          </div>
          <input
            type="range"
            min="6"
            max="45"
            value={frameSettings.borderSize}
            onChange={(e) => setFrameSettings(s => ({ ...s, borderSize: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between glass p-3 rounded-xl">
          <div className="font-sans">
            <span className="text-white/90 text-[11px] block font-medium">Garis Pembatas Foto</span>
            <span className="text-[9px] text-white/40 block">Beri garis tepi pemisah antar jepretan</span>
          </div>
          <input
            type="checkbox"
            checked={frameSettings.accentLining}
            onChange={(e) => setFrameSettings(s => ({ ...s, accentLining: e.target.checked }))}
            className="h-4.5 w-4.5 text-gold focus:ring-0 border-white/20 bg-black/45 rounded-md cursor-pointer"
          />
        </div>
      </div>

      {/* 4. CUSTOM STUDIO LABEL BANNER */}
      <div className="space-y-3.5 pt-3 border-t border-white/10 font-sans text-xs">
        <label className="text-white/95 font-semibold flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5 text-gold" />
          Kustom Label Cap Studio (Footer Text)
        </label>
        
        <input
          type="text"
          maxLength={30}
          placeholder="CONTOH: AURA STUDIO • MEI 2026"
          value={frameSettings.label}
          onChange={(e) => setFrameSettings(s => ({ ...s, label: e.target.value }))}
          className="w-full glass rounded-xl py-2.5 px-3.5 text-white placeholder-white/20 outline-none focus:border-gold/50 transition-colors"
        />

        <div className="grid grid-cols-2 gap-3.5 pt-1.5">
          <div>
            <span className="text-[10px] text-white/40 block mb-1">Pilih Estetika Font</span>
            <div className="flex gap-1.5 glass p-1 rounded-lg">
              {(['sans', 'mono', 'serif'] as const).map((styleOpt) => (
                <button
                   key={styleOpt}
                   onClick={() => setFrameSettings(s => ({ ...s, fontStyle: styleOpt }))}
                   className={`flex-1 py-1 text-[10px] rounded capitalize transition-all cursor-pointer ${
                     frameSettings.fontStyle === styleOpt
                       ? 'bg-gold text-slate-950 font-semibold shadow'
                       : 'text-white/50 hover:text-white'
                   }`}
                   style={{
                     fontFamily: styleOpt === 'mono' ? '"JetBrains Mono"' : styleOpt === 'serif' ? '"Playfair Display"' : 'inherit'
                   }}
                >
                  {styleOpt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-white/40 block mb-1">Warna Font Label</span>
            <div className="flex gap-1.5 font-sans">
              <input
                type="color"
                value={frameSettings.fontColor}
                onChange={(e) => setFrameSettings(s => ({ ...s, fontColor: e.target.value }))}
                className="h-7 w-7 p-0 border border-white/20 bg-transparent rounded cursor-pointer shrink-0"
              />
              <div className="flex-1 flex gap-1 items-center glass px-2 rounded">
                <span className="font-mono text-[9px] text-white/85">{frameSettings.fontColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE STICKERS OVERLAY */}
      <div className="space-y-3.5 pt-3 border-t border-white/10 font-sans text-xs">
        <label className="text-white/95 font-semibold flex items-center gap-1.5">
          <StickerIcon className="h-3.5 w-3.5 text-gold" />
          Tempel Stiker Premium (Drag & Drop Stickers)
        </label>
        
        {/* Available Stickers Dock */}
        <div className="glass p-3 rounded-2xl flex gap-2.5 overflow-x-auto scrollbar-thin">
          {PRESET_STICKERS.map((st) => (
            <button
              key={st.name}
              onClick={() => addSticker(st.emoji)}
              title={st.name}
              className="h-11 w-11 flex-shrink-0 bg-white/5 border border-white/15 rounded-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              {st.emoji}
            </button>
          ))}
        </div>

        {/* Sticker manipulation overlays (appears only if there's reactive selections) */}
        {stickers.length > 0 && (
          <div className="glass p-4 rounded-2xl space-y-3 animate-fade-in text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white/80 block">Sesuaikan Letak & Ukuran Stiker</span>
              {selectedStickerId && (
                <button
                  onClick={() => deleteSticker(selectedStickerId)}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[10px] cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Hapus Stiker
                </button>
              )}
            </div>

            {/* Sticker selections dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 font-sans">Pilih Stiker Aktif:</span>
              <select
                value={selectedStickerId || ''}
                onChange={(e) => setSelectedStickerId(e.target.value || null)}
                className="flex-1 glass border border-white/10 rounded-lg p-1.5 text-white outline-none cursor-pointer text-xs"
              >
                <option value="" className="bg-slate-950 text-white/50">-- Sentuh stiker pada kanvas --</option>
                {stickers.map((st, idx) => (
                  <option key={st.id} value={st.id} className="bg-slate-950 text-white">
                    Stiker #{idx + 1} ({st.emoji})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Sticker Key Controllers */}
            {selectedSticker && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Positional Cross controllers */}
                <div className="bg-black/30 p-2 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5">
                  <span className="text-[9px] text-white/40 mb-0.5 font-sans">Atur Titik Posisi</span>
                  <div className="flex flex-col items-center">
                    <button onClick={() => moveSticker('up')} className="p-1 hover:bg-white/10 rounded cursor-pointer text-white/70 hover:text-white"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <div className="flex gap-3">
                      <button onClick={() => moveSticker('left')} className="p-1 hover:bg-white/10 rounded cursor-pointer text-white/70 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /></button>
                      <span className="font-mono text-[9px] text-white flex items-center">{selectedSticker.emoji}</span>
                      <button onClick={() => moveSticker('right')} className="p-1 hover:bg-white/10 rounded cursor-pointer text-white/70 hover:text-white"><ArrowRight className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => moveSticker('down')} className="p-1 hover:bg-white/10 rounded cursor-pointer text-white/70 hover:text-white"><ArrowDown className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {/* Rotations and scale controllers */}
                <div className="flex flex-col justify-between gap-1.5">
                  {/* Scaling row */}
                  <div className="bg-black/30 p-2.5 border border-white/10 rounded-xl flex items-center justify-between">
                    <span className="text-[9px] text-white/50 font-sans">Ukuran ({selectedSticker.scale})</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => scaleSticker('minus')}
                        className="bg-white/5 hover:bg-white/10 h-6 w-6 rounded flex items-center justify-center border border-white/10 cursor-pointer text-white/70"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => scaleSticker('plus')}
                        className="bg-white/5 hover:bg-white/10 h-6 w-6 rounded flex items-center justify-center border border-white/10 cursor-pointer text-white/70"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Rotation row */}
                  <div className="bg-black/30 p-2.5 border border-white/10 rounded-xl flex items-center justify-between">
                    <span className="text-[9px] text-white/50 font-sans">Rotasi Kemiringan ({selectedSticker.rotation}°)</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rotateSticker('ccw')}
                        title="Putar CCW"
                        className="bg-white/5 hover:bg-white/10 h-6 w-6 rounded flex items-center justify-center border border-white/10 cursor-pointer text-white/70"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => rotateSticker('cw')}
                        title="Putar CW"
                        className="bg-white/5 hover:bg-white/10 h-6 w-6 rounded flex items-center justify-center border border-white/10 cursor-pointer text-white/70"
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
