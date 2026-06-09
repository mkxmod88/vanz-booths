/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Printer, Share2, Eye, Calendar, Film, X, Check, Copy, Sparkles, MessageCircle, Twitter } from 'lucide-react';
import { CapturedPhoto } from '../types';

interface GalleryVaultProps {
  photos: CapturedPhoto[];
  onDeletePhoto: (id: string) => void;
  selectedPhoto: CapturedPhoto | null;
  setSelectedPhoto: (p: CapturedPhoto | null) => void;
}

export default function GalleryVault({
  photos,
  onDeletePhoto,
  selectedPhoto,
  setSelectedPhoto
}: GalleryVaultProps) {
  const [activeTab, setActiveTab] = useState<'static' | 'gif'>('static');
  
  // GIF simulation state - loops through captured frames
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);

  // Play slideshow GIF effect when "gif" tab is selected
  useEffect(() => {
    if (activeTab !== 'gif' || !selectedPhoto || selectedPhoto.frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIdx(prev => (prev + 1) % selectedPhoto.frames.length);
    }, 550); // fast loop typical for photobooth gifs

    return () => clearInterval(interval);
  }, [activeTab, selectedPhoto]);

  // Handle high resolution print triggers
  const executePrint = () => {
    // We print using the browser print system. Our print stylesheet in index.css
    // targets elements inside '#print-area' for visibility, enabling clean printing.
    window.print();
  };

  // Generate dynamic QR Code using custom parameters
  const getShareLink = () => {
    if (!selectedPhoto) return 'https://aura-studio.booth';
    return `${window.location.origin}?retrieve=${selectedPhoto.id}`;
  };

  const copyShareLink = () => {
    try {
      navigator.clipboard.writeText(getShareLink());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      alert('Gagal menyalin tautan.');
    }
  };

  return (
    <div className="glass rounded-3xl p-6 shadow-luxe select-none" id="cloud-vault">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="font-sans font-semibold text-lg text-white tracking-tight">Koleksi Awan Instan</h2>
          <p className="font-mono text-[10px] text-white/50 tracking-wider">HASIL JEPRETAN & PENYIMPANAN CLOUD GALLERY</p>
        </div>
        <div className="bg-gold/15 border border-gold/30 rounded-full px-3 py-1 font-mono text-[11px] text-gold font-semibold shadow-luxe">
          {photos.length} TOTAL JEPRI_STRIP
        </div>
      </div>

      {/* Grid List */}
      {photos.length === 0 ? (
        <div className="py-16 text-center">
          <Film className="h-10 w-10 text-white/30 mx-auto mb-3 animate-pulse" />
          <p className="font-serif italic text-sm text-white/40">Belum ada hasil jepretan.</p>
          <p className="font-sans text-xs text-white/30 mt-1 max-w-sm mx-auto">Ambil 4 foto pertamamu menggunakan kamera di atas untuk mencetak strip bingkai impian Anda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4.5 max-h-[480px] overflow-y-auto scrollbar-thin">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => {
                setSelectedPhoto(photo);
                setActiveTab('static');
              }}
              className="relative group aspect-[2/3] glass border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-gold/50 hover:scale-[1.02] hover:shadow-luxe transition-all"
            >
              <img
                src={photo.imageSrc}
                alt={`Aura strip ${photo.id}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-3 text-center transition-all">
                <Eye className="h-6 w-6 text-gold mb-2 animate-bounce" />
                <span className="font-sans font-medium text-xs text-white truncate w-full">{photo.bannerText || 'Classic Strip'}</span>
                <span className="font-mono text-[9px] text-white/40 mt-1">{photo.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAILED VIEW MODAL ONCE SELECTED */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass border-white/10 rounded-3xl max-w-4xl w-full flex flex-col md:flex-row shadow-luxe overflow-hidden">
            
            {/* Visual Screen Box */}
            <div className="flex-1 bg-black/20 flex items-center justify-center p-6 min-h-[400px] md:min-h-[550px]">
              {activeTab === 'static' ? (
                <div className="max-w-[340px] w-full shadow-luxe relative select-none">
                  {/* Invisible print identifier layer */}
                  <div id="print-area">
                    <img
                      src={selectedPhoto.imageSrc}
                      alt="Printed premium strip"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto rounded-xl border border-white/10"
                    />
                  </div>
                </div>
              ) : (
                /* GIF Slide Loop display format */
                <div className="max-w-[340px] w-full aspect-[4/3] glass border-white/10 rounded-2xl overflow-hidden shadow-luxe relative">
                  <div className="absolute top-3 left-3 bg-[#D4AF37] border border-white/10 rounded px-2 py-0.5 font-mono text-[9px] text-slate-950 font-bold tracking-widest uppercase z-10 select-none animate-pulse">
                    GIF PLAYBACK
                  </div>
                  {selectedPhoto.frames && selectedPhoto.frames[currentFrameIdx] ? (
                    <img
                      src={selectedPhoto.frames[currentFrameIdx]}
                      alt="Animated slideshow frame"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 font-mono text-xs">
                      Menyusun animasi...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description and Action Sidebar details */}
            <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-sans font-bold text-lg text-white truncate w-[260px]">
                      {selectedPhoto.bannerText || 'Premium Photo Strip'}
                    </h3>
                    <p className="font-mono text-[10px] text-white/50 uppercase tracking-wider">PREVIEW & STUDIO EXPORTER</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPhoto(null);
                      setActiveTab('static');
                    }}
                    className="p-1.5 glass hover:border-white/20 hover:text-[#D4AF37] rounded-xl transition-all cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Switch view layers */}
                <div className="flex glass border-white/10 rounded-xl p-1 font-sans text-xs">
                  <button
                    onClick={() => setActiveTab('static')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      activeTab === 'static' ? 'bg-gold text-slate-950 font-bold shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Resolusi Cetak (Static)
                  </button>
                  <button
                    onClick={() => setActiveTab('gif')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      activeTab === 'gif' ? 'bg-gold text-slate-950 font-bold shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Animasi Loop (GIF)
                  </button>
                </div>

                {/* Telemetry data info log */}
                <div className="glass border-white/5 rounded-2xl p-4.5 space-y-3 font-sans text-xs text-white/80">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-white/40 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gold" /> Tanggal Selesai</span>
                    <span className="font-mono text-white/90">{selectedPhoto.timestamp}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-white/40 flex items-center gap-1.5"><Film className="h-3.5 w-3.5 text-gold" /> Tata Letak</span>
                    <span className="font-mono text-white/90 capitalize">{selectedPhoto.layout.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-white/40 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-gold" /> Saringan Filter</span>
                    <span className="font-mono text-white/90 capitalize">{selectedPhoto.filter.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-white/10">
                    <span className="text-white/60 font-semibold">Tipe Hasil Prints:</span>
                    <span className="text-gold font-mono font-bold uppercase">4K ULTRA-HD READY</span>
                  </div>
                </div>
              </div>

              {/* Action buttons drawer */}
              <div className="space-y-3.5 mt-auto">
                <a
                  href={selectedPhoto.imageSrc}
                  download={`Aura-Premium-Strip-${selectedPhoto.id}.png`}
                  className="w-full flex items-center justify-center gap-2.5 bg-gold text-slate-950 font-sans font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider hover:bg-[#E5C158] active:scale-[0.98] transition-all text-center cursor-pointer shadow-luxe"
                >
                  <Download className="h-4 w-4" /> Unduh Strip 4K (PNG)
                </a>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={executePrint}
                    className="flex-1 flex items-center justify-center gap-1.5 glass border-white/10 text-white font-sans font-medium py-2 px-3 rounded-xl text-xs hover:border-gold/30 transition-all cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-gold" /> Cetak Langsung
                  </button>
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 glass border-white/10 text-white font-sans font-medium py-2 px-3 rounded-xl text-xs hover:border-gold/30 transition-all cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5 text-gold" /> Bagi Sosial
                  </button>
                </div>

                <button
                  onClick={() => {
                    const ok = confirm("Yakin ingin menghapus jepretan ini dari cloud gallery?");
                    if (ok) {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }
                  }}
                  className="w-full py-2 border border-red-500/10 hover:bg-red-500/5 text-red-400 font-sans text-2xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Hapus File Jepretan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC SHARING SHEET WITH SCANNABLE QR CODES */}
      {shareModalOpen && selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="glass border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-6 text-center shadow-luxe relative select-none">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1 glass hover:border-white/20 rounded-lg text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h4 className="font-sans font-bold text-white text-base">Bagikan Hasil Jepretan</h4>
              <p className="font-mono text-[9px] text-white/50 mt-0.5 tracking-wider uppercase">INTEGRASI QR CODE DAN LINK AWAN INSTAN</p>
            </div>

            {/* Simulated Live Scanable QR Code */}
            <div className="bg-white p-3 rounded-2xl inline-block shadow-luxe mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getShareLink())}&color=1e293b`}
                alt="Cloud shareable photobooth QR code"
                referrerPolicy="no-referrer"
                className="w-44 h-44 border-0"
              />
            </div>

            <p className="font-sans text-[11px] text-white/60 leading-relaxed px-2">
              Arahkan kamera ponsel Anda pada QR code di atas untuk mengunduh, melihat instan di browser ponsel Anda, atau menyimpan ke laci pribadi.
            </p>

            {/* One-click social handlers */}
            <div className="space-y-3 font-sans">
              <div className="flex glass border-white/10 p-2 rounded-xl justify-between items-center text-xs">
                <span className="truncate pr-4 text-white/40 font-mono text-[10px] text-left">{getShareLink().slice(0, 30)}...</span>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-1 text-gold hover:text-amber-300 px-2 py-1 glass border-white/10 rounded-lg text-[10px] font-mono cursor-pointer transition-all shrink-0"
                >
                  {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedLink ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              {/* Whatsapp, Twitter links */}
              <div className="flex gap-2 font-sans">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Lihat hasil jepretan foto estetik premium saya di Aura Photo Booth! ' + getShareLink())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex gap-2 items-center justify-center bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/30 py-2.5 text-xs text-emerald-400 rounded-xl transition-all cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Papan cetak 4K premium dari Aura Booth. Kece abis!')}&url=${encodeURIComponent(getShareLink())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex gap-2 items-center justify-center bg-sky-600/10 hover:bg-sky-600/25 border border-sky-500/30 py-2.5 text-xs text-sky-400 rounded-xl transition-all cursor-pointer"
                >
                  <Twitter className="h-4 w-4" /> Twitter
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
