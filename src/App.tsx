/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Printer, RefreshCw, Trash2, HelpCircle, Columns, Monitor, Grid, History, Crown, Info, X } from 'lucide-react';
import { 
  PhotoStripLayout, 
  FrameSettings, 
  ProCameraSettings, 
  CapturedPhoto, 
  Sticker, 
  FilterType,
  BG_TEMPLATES
} from './types';
import { renderHighFidelityStrip, generatePhotoID } from './utils';
import CameraPanel from './components/CameraPanel';
import FrameCustomizer from './components/FrameCustomizer';
import GalleryVault from './components/GalleryVault';

export default function App() {
  // 1. Core State registers
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [photosVault, setPhotosVault] = useState<CapturedPhoto[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  
  // Compiling overlay trigger
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilationSuccess, setCompilationSuccess] = useState<boolean>(false);

  // Pro Camera Configuration
  const [proSettings, setProSettings] = useState<ProCameraSettings>({
    brightness: 100,
    contrast: 100,
    warmth: 0,
    saturation: 100,
    iso: 200,
    sharpness: 20,
    voiceTrigger: false,
    voiceThreshold: 45,
    chromaKey: false,
    chromaColor: '#0c9204', // default chroma green
    chromaTolerance: 45,
    selectedBgId: 'marble'
  });

  // Premium Framing Customizers
  const [frameSettings, setFrameSettings] = useState<FrameSettings>({
    borderSize: 22,
    borderColor: '#090d16',
    label: 'AURA PREMIUM STUDIO',
    fontStyle: 'serif',
    fontColor: '#d97706', // Gold Amber stamp
    cardStyle: 'gold-lining',
    accentLining: true
  });

  // Hot Stickers state list (initialised with custom cute star decoration)
  const [stickers, setStickers] = useState<Sticker[]>([
    { id: 'st-init-1', emoji: '✨', x: 18, y: 15, scale: 28, rotation: -12 },
    { id: 'st-init-2', emoji: '👑', x: 80, y: 8, scale: 32, rotation: 15 }
  ]);

  const [layout, setLayout] = useState<PhotoStripLayout>('vertical-strip');

  // Load photos historical indices on viewport entry
  useEffect(() => {
    try {
      const cached = localStorage.getItem('aura_booth_vault');
      if (cached) {
        setPhotosVault(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Gagal memuat arsip laci lokal.', e);
    }
  }, []);

  // Sync back to local container on every compilation update
  const syncVaultAndSave = (updated: CapturedPhoto[]) => {
    setPhotosVault(updated);
    try {
      localStorage.setItem('aura_booth_vault', JSON.stringify(updated));
    } catch (e) {
      console.error('Gagal menyimpan laci lokal.', e);
    }
  };

  /**
   * Monitor frame count to automatically trigger the 4K high fidelity compilation pipeline
   */
  useEffect(() => {
    if (capturedFrames.length === 0) return;

    // Determine targeted count depending on selected active layout rules
    let targetCount = 4; // default vertical
    if (layout === 'grid-2x2') targetCount = 4;
    if (layout === 'landscape-double') targetCount = 2;
    if (layout === 'solo-studio') targetCount = 1;

    if (capturedFrames.length >= targetCount) {
      // Buffer full! Trigger compilation modal
      compileActiveSessionStrips(capturedFrames);
    }
  }, [capturedFrames, layout]);

  /**
   * Capture a new single frame and buffer it
   */
  const handleSnapshotTaken = (base64Img: string) => {
    setCapturedFrames(prev => [...prev, base64Img]);
  };

  /**
   * Call the High-Fidelity 4K Generator to compile frames, borders, labels and stickers
   */
  const compileActiveSessionStrips = async (framesToCompile: string[]) => {
    setIsCompiling(true);
    try {
      // Compile 4K Resolution
      const compiledHDUrl = await renderHighFidelityStrip(
        framesToCompile,
        layout,
        activeFilter,
        frameSettings,
        proSettings,
        stickers
      );

      const timestamp = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ', ' + new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });

      const newPhoto: CapturedPhoto = {
        id: generatePhotoID(),
        timestamp,
        imageSrc: compiledHDUrl,
        frames: [...framesToCompile],
        layout,
        filter: activeFilter,
        bannerText: frameSettings.label,
        borderColor: frameSettings.borderColor,
        stickers: [...stickers]
      };

      const updatedVault = [newPhoto, ...photosVault];
      syncVaultAndSave(updatedVault);

      setCompilationSuccess(true);
      // Clear session frames so they can pose again
      setCapturedFrames([]);

      // Auto dismiss success toast message
      setTimeout(() => {
        setCompilationSuccess(false);
      }, 4000);

    } catch (err) {
      console.error('Gagal melakukan kompilasi foto.', err);
      alert('Kompilasi kanvas gagal. Coba lagi.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDeletePhoto = (id: string) => {
    const updated = photosVault.filter(p => p.id !== id);
    syncVaultAndSave(updated);
  };

  const clearSnapshotSession = () => {
    setCapturedFrames([]);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-gold selection:text-slate-950 font-sans relative overflow-x-hidden" id="studio-core">
      {/* Mesh Background */}
      <div className="mesh-bg" />
      
      {/* 1. HERO TOP GLOW HEADER */}
      <header className="border-b border-white/10 glass sticky top-0 z-40 select-none shadow-luxe rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gold flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
              <Camera className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-sans font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Aura Photo Booth
                </h1>
                <span className="bg-white/10 text-gold text-[9px] font-mono px-2 py-0.5 rounded border border-white/15 font-bold uppercase">
                  Pro 4K
                </span>
              </div>
              <p className="font-mono text-[9px] text-white/40 tracking-wider">SEKOLAH FOTO MANDIRI • EDISI LUXURY</p>
            </div>
          </div>

          {/* Slogan banner */}
          <div className="hidden md:flex items-center gap-2 glass rounded-full px-4.5 py-1.5 text-xs text-white/80">
            <Crown className="h-3.5 w-3.5 text-gold shrink-0 animate-pulse" />
            <span>Studio digital mewah dengan kustomisasi bingkai premium dan cetak instan.</span>
          </div>

          {/* Quick guides */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-white/50">
            <span>Waktu Lokal:</span>
            <span className="text-gold font-semibold glass px-2.5 py-1 rounded-lg">
              2026-06-09
            </span>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE MATRIX */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CAMERA CONSOLE & PRO CONTROLS */}
        <section className="lg:col-span-4 flex flex-col gap-6 w-full">
          <CameraPanel
            settings={proSettings}
            setSettings={setProSettings}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            onSnapshotTaken={handleSnapshotTaken}
            isCapturing={isCapturing}
            setIsCapturing={setIsCapturing}
          />
        </section>

        {/* CENTRAL COLUMN: INTERACTIVE VISUAL PREVIEW CARD */}
        <section className="lg:col-span-4 w-full flex flex-col items-center gap-6">
          
          <div className="w-full glass shadow-luxe rounded-3xl p-5 relative select-none">
            {/* Header info bar */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-5 text-white/50 font-mono text-[10px]">
              <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-gold" /> Pratinjau Bingkai</span>
              {capturedFrames.length > 0 && (
                <button
                  onClick={clearSnapshotSession}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-sans text-[9px] uppercase hover:underline"
                  title="Batalkan Sesi Foto ini"
                >
                  <Trash2 className="h-2.5 w-2.5" /> Batal ({capturedFrames.length})
                </button>
              )}
            </div>

            {/* REAL-TIME PREVIEW CARD BORDER CONTAINER */}
            <div 
              className={`w-full max-w-[280px] mx-auto aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 border border-slate-700/20`}
              style={{
                backgroundColor: frameSettings.borderColor,
                padding: `${frameSettings.borderSize * 0.4}px`, // ratioed spacing for display
                backgroundImage: 
                frameSettings.cardStyle === 'gold-lining' 
                  ? 'linear-gradient(135deg, #050510 0%, #171728 50%, #03030d 100%)' 
                  : frameSettings.cardStyle === 'cyber-neon'
                  ? 'linear-gradient(45deg, #090d16 0%, #05050e 100%)' 
                  : frameSettings.cardStyle === 'wood-grain'
                  ? 'linear-gradient(to right, #2d1405 0%, #451a03 100%)' 
                  : frameSettings.cardStyle === 'polaroid'
                  ? '#f8fafc'
                  : 'none',
                // Neon glow simulation if selected
                boxShadow: frameSettings.cardStyle === 'cyber-neon' 
                  ? '0 0 25px rgba(236,72,153,0.25), 0 0 50px rgba(59,130,246,0.15)' 
                  : frameSettings.cardStyle === 'gold-lining'
                  ? '0 10px 30px rgba(212,175,55,0.15)'
                  : 'none',
                border: frameSettings.cardStyle === 'gold-lining'
                  ? '3px solid #D4AF37'
                  : frameSettings.cardStyle === 'cyber-neon'
                  ? '4px solid #ec4899'
                  : '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {/* Inner accent border lines */}
              {frameSettings.cardStyle === 'gold-lining' && (
                <div className="absolute inset-2 border-2 border-[#D4AF37]/35 rounded-xl pointer-events-none z-10" />
              )}
              {frameSettings.cardStyle === 'cyber-neon' && (
                <div className="absolute inset-1.5 border border-cyan-500/30 rounded-xl pointer-events-none z-10" />
              )}

              {/* RENDER ACTIVE LAYOUT CONTENT */}
              <div className="w-full h-full flex flex-col justify-between" id="active-strip">
                
                {/* 1. Classic Vertical Strip */}
                {layout === 'vertical-strip' && (
                  <div className="grid grid-rows-4 gap-2 h-[82%] mb-1 overflow-hidden">
                    {[0, 1, 2, 3].map((idx) => {
                      const frame = capturedFrames[idx];
                      return (
                        <div 
                          key={idx} 
                          className="bg-black/50 border border-white/5 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner"
                        >
                          {frame ? (
                            <img src={frame} alt="Captured preview slot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-center p-2">
                              <Camera className={`h-4.5 w-4.5 mx-auto mb-1 text-white/20 ${capturedFrames.length === idx ? 'text-gold animate-pulse' : ''}`} />
                              <span className="font-mono text-[8px] text-white/30">SLOT {idx + 1}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Grid 2x2 layout */}
                {layout === 'grid-2x2' && (
                  <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[82%] mb-1 overflow-hidden">
                    {[0, 1, 2, 3].map((idx) => {
                      const frame = capturedFrames[idx];
                      return (
                        <div 
                          key={idx} 
                          className="bg-black/50 border border-white/5 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner"
                        >
                          {frame ? (
                            <img src={frame} alt="Captured preview slot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-center p-1">
                              <Camera className={`h-4 w-4 mx-auto mb-0.5 text-white/20 ${capturedFrames.length === idx ? 'text-gold animate-pulse' : ''}`} />
                              <span className="font-mono text-[7.5px] text-white/30">{idx + 1}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Landscape Double */}
                {layout === 'landscape-double' && (
                  <div className="grid grid-cols-2 gap-2.5 h-[82%] mb-1 overflow-hidden pt-4">
                    {[0, 1].map((idx) => {
                      const frame = capturedFrames[idx];
                      return (
                        <div 
                          key={idx} 
                          className="bg-black/50 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner"
                        >
                          {frame ? (
                            <img src={frame} alt="Captured preview slot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-center p-2">
                              <Camera className={`h-5 w-5 mx-auto mb-1 text-white/20 ${capturedFrames.length === idx ? 'text-gold animate-pulse' : ''}`} />
                              <span className="font-mono text-[8px] text-white/30">LENS {idx + 1}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Solo Studio */}
                {layout === 'solo-studio' && (
                  <div className="h-[84%] mb-1 overflow-hidden pt-2">
                    <div className="w-full h-full bg-black/50 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                      {capturedFrames[0] ? (
                        <img src={capturedFrames[0]} alt="Captured preview slot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-center p-3">
                          <Crown className="h-7 w-7 mx-auto mb-2 text-gold animate-bounce" />
                          <span className="font-serif italic text-xs text-white/60 block mb-1">Solo Studio 4K</span>
                          <span className="font-mono text-[8px] text-white/30">MENUNGGU SENSOR UTAMA...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* FOOTER LABEL */}
                {frameSettings.label && (
                  <div className="text-center pb-2 pt-1 select-none flex flex-col justify-center h-[14%]">
                    <h5 
                      className="font-semibold text-[11px] tracking-widest uppercase truncate px-2.5 transition-all"
                      style={{
                        color: frameSettings.fontColor,
                        fontFamily: frameSettings.fontStyle === 'mono' ? '"JetBrains Mono"' : frameSettings.fontStyle === 'serif' ? '"Playfair Display"' : 'inherit'
                      }}
                    >
                      {frameSettings.label}
                    </h5>
                    <span 
                      className="text-[6.5px] tracking-wider block mt-0.5 opacity-60 uppercase"
                      style={{ color: frameSettings.fontColor }}
                    >
                      ★ 4K DIGITAL BOOTH MEMORIES ★
                    </span>
                  </div>
                )}

                {/* DYNAMIC FLOATING STICKERS LAYER */}
                {stickers.map((st) => {
                  const isSelected = selectedStickerId === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={(e) => {
                        e.stopPropagation(); // preserve capture taps
                        setSelectedStickerId(st.id);
                      }}
                      className={`absolute cursor-pointer transition-shadow z-25 hover:scale-105 active:scale-95 flex items-center justify-center select-none ${
                        isSelected ? 'border-2 border-dashed border-gold bg-slate-950/10 rounded-xl p-1' : ''
                      }`}
                      style={{
                        left: `${st.x}%`,
                        top: `${st.y}%`,
                        transform: `translate(-50%, -50%) rotate(${st.rotation}deg)`,
                        fontSize: `${st.scale * 1.0}px`, // scaling factor
                        filter: isSelected ? 'drop-shadow(0 0 8px rgba(212,175,55,0.8))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
                      }}
                    >
                      {st.emoji}
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Hint details beneath preview block */}
            <div className="mt-5 glass p-3.5 rounded-2xl flex items-start gap-2.5 text-[11px] text-white/70 select-none">
              <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <span>
                <strong>Tips Kreatif:</strong> Ketuk langsung stiker apa saja di dalam bingkai pratinjau untuk menyeleksinya. Gunakan tombol kursor kontrol stiker di kolom kanan untuk digeser, diputar, atau diperbesar!
              </span>
            </div>
          </div>
          
          {/* Active compiling state layout */}
          <div className="w-full">
            {capturedFrames.length > 0 && (
              <div className="glass p-4 rounded-2xl text-center space-y-3.5 flex flex-col justify-center border-gold-aura shadow-luxe">
                <div>
                  <span className="font-semibold text-xs text-gold block">Sesi Foto Sedang Berjalan...</span>
                  <span className="font-mono text-[9px] text-white/50 block mt-1">Mengambil {capturedFrames.length} dari 4 jepretan</span>
                </div>
                <div className="flex gap-1.5 h-1.5 bg-black/40 rounded-full overflow-hidden w-40 mx-auto">
                  <div 
                    className="h-full bg-gold transition-all duration-305"
                    style={{ width: `${(capturedFrames.length / 4) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => compileActiveSessionStrips(capturedFrames)}
                  className="mx-auto cursor-pointer flex gap-1.5 items-center justify-center bg-gold text-black rounded-xl py-2 px-5 font-sans text-[11px] font-bold tracking-wider hover:scale-105 active:scale-95 transition-all"
                >
                  Kompilasi Strip Sekarang
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: STYLE CUSTOMIZER PANEL & ARCHIVE GRID */}
        <section className="lg:col-span-4 flex flex-col gap-6 w-full">
          <FrameCustomizer
            layout={layout}
            setLayout={setLayout}
            frameSettings={frameSettings}
            setFrameSettings={setFrameSettings}
            stickers={stickers}
            setStickers={setStickers}
            selectedStickerId={selectedStickerId}
            setSelectedStickerId={setSelectedStickerId}
          />

          <GalleryVault
            photos={photosVault}
            onDeletePhoto={handleDeletePhoto}
            selectedPhoto={selectedPhoto}
            setSelectedPhoto={setSelectedPhoto}
          />
        </section>

      </main>

      {/* 3. DYNAMIC OVERLAY LOADING BOX */}
      {isCompiling && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-6 select-none animate-fade-in">
          <RefreshCw className="h-10 w-10 text-gold animate-spin mb-4" />
          <h3 className="font-semibold text-lg text-white">Menyusun Frame Cap Studio...</h3>
          <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest mt-1.5">MENGGAMBAR KANVAS RESOLUSI TINGGI 4K • HARAP TUNGGU</p>
        </div>
      )}

      {/* COMPILATION SUCCESS TOAST */}
      {compilationSuccess && (
        <div className="fixed bottom-6 left-6 z-[100] glass border-gold-aura shadow-luxe p-4 rounded-2xl flex gap-3 text-slate-100 animate-fade-in max-w-sm select-none">
          <div className="h-5 w-5 bg-gold rounded-full flex items-center justify-center shrink-0">
            <span className="text-black font-bold text-xs">✓</span>
          </div>
          <div>
            <span className="font-bold text-xs text-gold block">Kompilasi Selesai!</span>
            <span className="font-sans text-[10px] text-white/80 block mt-0.5">Hasil jepretan Anda telah disinkronkan langsung ke cloud laci gallery.</span>
          </div>
        </div>
      )}

      {/* 4. FOOTER CREDITS */}
      <footer className="border-t border-white/10 mt-16 py-8 text-center glass rounded-t-3xl select-none">
        <p className="font-sans text-[11px] text-white/40 tracking-widest">
          AURA PHOTO BOOTH • 4K ULTRA DENSITY DIGITAL MEMORIES STUDIO
        </p>
        <p className="font-mono text-[9px] text-gold/60 mt-1 uppercase tracking-wider">
          DIKEMBANGKAN SEPENUHNYA SECARA FULL-STACK UNTUK PENGALAMAN DIGITAL PREMIUM
        </p>
      </footer>

    </div>
  );
}
