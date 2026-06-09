/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, AudioLines, Monitor, Sparkles, Sliders, Palette, ShieldAlert } from 'lucide-react';
import { ProCameraSettings, FilterType, BG_TEMPLATES, AUDIO_SHUTTER_SOUNDS } from '../types';
import { applyProFiltersAndGrain, processChromaKey } from '../utils';

interface CameraPanelProps {
  settings: ProCameraSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProCameraSettings>>;
  activeFilter: FilterType;
  setActiveFilter: (f: FilterType) => void;
  onSnapshotTaken: (base64Img: string) => void;
  isCapturing: boolean;
  setIsCapturing: (c: boolean) => void;
}

export default function CameraPanel({
  settings,
  setSettings,
  activeFilter,
  setActiveFilter,
  onSnapshotTaken,
  isCapturing,
  setIsCapturing
}: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string>('');
  
  // Timer controls
  const [countdown, setCountdown] = useState<number>(-1);
  const [sessionPhotosLeft, setSessionPhotosLeft] = useState<number>(0);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [mirrorVideo, setMirrorVideo] = useState<boolean>(true);
  const [uiTab, setUiTab] = useState<'pro' | 'filters' | 'chroma'>('filters');

  // Trigger audio noises
  const playSound = (type: 'countdown' | 'shutter') => {
    try {
      const audio = new Audio(AUDIO_SHUTTER_SOUNDS[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Find camera devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(deviceList => {
        const videoInputs = deviceList.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      })
      .catch(() => {
        setCameraError('Gagal mendeteksi kamera eksternal atau webcam.');
      });
  }, []);

  // Set up camera stream
  useEffect(() => {
    if (!selectedDeviceId) return;

    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    setCameraError('');
    const constraints = {
      video: {
        deviceId: { exact: selectedDeviceId },
        // Prompt requested high-quality printing capabilities: let's request 4K/FullHD resolution!
        width: { ideal: 3840 },
        height: { ideal: 2160 }
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(s => {
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        // Fallback to standard resolution if 4K constraints fail
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(s => {
            setStream(s);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
          })
          .catch(() => {
            setCameraError('Akses kamera ditolak. Berikan izin di browser Anda untuk menjalankan bilik foto.');
          });
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedDeviceId]);

  // Decibel analyzer structure for "Cheese Shutter" voice trigger
  useEffect(() => {
    if (settings.voiceTrigger && !micStream) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(mStream => {
          setMicStream(mStream);
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioCtx();
          audioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(mStream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64; // low complexity
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calc average frequency power
            let total = 0;
            for (let i = 0; i < bufferLength; i++) {
              total += dataArray[i];
            }
            const avg = total / bufferLength;
            const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
            setAudioLevel(normalizedLevel);

            // Shutter Trigger Condition (Loud Peak - shout "Cheese!")
            if (normalizedLevel > settings.voiceThreshold && countdown === -1 && !isCapturing) {
              // Sound trigger initiates 4-cuts countdown series!
              triggerSessionCountdown();
            }

            rafRef.current = requestAnimationFrame(checkLevel);
          };

          rafRef.current = requestAnimationFrame(checkLevel);
        })
        .catch(() => {
          setSettings(s => ({ ...s, voiceTrigger: false }));
          alert('Gagal mengaktifkan mikrofon untuk sensor suara.');
        });
    } else if (!settings.voiceTrigger && micStream) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
      setAudioLevel(0);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [settings.voiceTrigger, settings.voiceThreshold]);

  // Clean-up mic capture on destroy
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (micStream) micStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  /**
   * Run 4-series Snapshot capture sequence (for standard photostrips)
   */
  const triggerSessionCountdown = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setSessionPhotosLeft(4); // Takes 4 pictures
    startCountdownTimer(4);  // 4, 3, 2, 1, 0 -> capture!
  };

  const startCountdownTimer = (photosLeft: number) => {
    setCountdown(5); // 5 sec timer per photo
    playSound('countdown');

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          captureSnapshot(photosLeft);
          return -1;
        }
        playSound('countdown');
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Draw the video output frame to a pristine high-resolution snapshot
   */
  const captureSnapshot = (photosLeft: number) => {
    if (!videoRef.current || !canvasRef.current) {
      setIsCapturing(false);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Output matches high design definitions
    const w = video.videoWidth || 1920;
    const h = video.videoHeight || 1085;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply digital mirroring if matching default user preferences
    if (mirrorVideo) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    // Draw active video
    ctx.drawImage(video, 0, 0, w, h);

    // Reset mirroring matrices
    if (mirrorVideo) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Apply Chroma Key (Background removal) if activated
    if (settings.chromaKey) {
      processChromaKey(ctx, w, h, settings.chromaColor, settings.chromaTolerance);
      
      // Draw selected luxury background backdrop of our photostudio
      const bg = BG_TEMPLATES.find(b => b.id === settings.selectedBgId);
      if (bg) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over'; // draw behind transparent cutouts

        if (bg.color && bg.color.startsWith('linear-gradient')) {
          // create luxury gradient representation path
          const grad = ctx.createLinearGradient(0, 0, w, h);
          if (bg.id === 'cyber-neon') {
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.6, '#1e1b4b');
            grad.addColorStop(1, '#311042');
          } else if (bg.id === 'marble') {
            grad.addColorStop(0, '#e2e8f0');
            grad.addColorStop(0.5, '#f8fafc');
            grad.addColorStop(1, '#cbd5e1');
          } else if (bg.id === 'gold-sparkle') {
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.5, '#eab308');
            grad.addColorStop(1, '#ca8a04');
          } else if (bg.id === 'cosmic') {
            grad.addColorStop(0, '#1e1b4b');
            grad.addColorStop(0.5, '#311042');
            grad.addColorStop(1, '#020617');
          } else {
            grad.addColorStop(0, '#6b21a8');
            grad.addColorStop(1, '#db2777');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        } else if (bg.color) {
          ctx.fillStyle = bg.color;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
      }
    }

    // Apply pro settings, exposure matrices, warmth adjustments, and film grain based on ISO dials
    applyProFiltersAndGrain(ctx, w, h, settings, activeFilter);

    // White flash-sheet burst
    setFlashActive(true);
    playSound('shutter');
    setTimeout(() => setFlashActive(false), 200);

    const base64 = canvas.toDataURL('image/png', 1.0);
    onSnapshotTaken(base64);

    const remaining = photosLeft - 1;
    setSessionPhotosLeft(remaining);

    if (remaining > 0) {
      // Loop with next photo countdown in 1.5 seconds to let user adjust positions/poses!
      setTimeout(() => {
        startCountdownTimer(remaining);
      }, 1500);
    } else {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col glass backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-luxe p-6" id="hasselblad-camera-back">
      {/* Sub Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 select-none">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-[#D4AF37] animate-ping" />
            <span className="relative block h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
          </div>
          <div>
            <h2 className="font-sans font-semibold text-lg text-white tracking-tight">Kamera Utama 4K</h2>
            <p className="font-mono text-[10px] text-white/50">STATUS: STUDIO SYNCED • RES: 3840x2160</p>
          </div>
        </div>

        {/* Hot Swap Camera Selector */}
        <div className="flex items-center gap-2">
          {devices.length > 1 && (
            <div className="flex items-center glass rounded-xl px-2.5 py-1">
              <RefreshCw className="h-3 w-3 text-gold mr-1.5 animate-spin-slow" />
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-transparent text-white/80 font-sans text-xs border-none outline-none cursor-pointer pr-1 focus:ring-0"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-slate-950 text-white">
                    Lens {idx + 1}: {device.label ? device.label.slice(0, 15) : `Webcam ${idx}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setMirrorVideo(!mirrorVideo)}
            title="Cerminkan Pratinjau Video"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              mirrorVideo 
                ? 'bg-gold/15 border-gold text-gold shadow-luxe' 
                : 'glass text-white/50 hover:text-white'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Stream Screen */}
      <div className="relative mt-5 aspect-[4/3] w-full rounded-2xl overflow-hidden glass border-white/10 group">
        {/* Real-time Stream */}
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover select-none ${mirrorVideo ? 'scale-x-[-1]' : ''}`}
            style={{
              filter: activeFilter === 'none' ? `
                brightness(${settings.brightness}%)
                contrast(${settings.contrast}%)
                saturate(${settings.saturation}%)
                sepia(${settings.warmth}%)
              ` : undefined
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Camera className="h-10 w-10 text-white/30 mb-3 animate-pulse" />
            <p className="font-sans text-white/50 text-sm">Menghubungkan sensor studio...</p>
          </div>
        )}

        {/* Camera block error handling */}
        {cameraError && (
          <div className="absolute inset-x-4 top-4 bg-rose-950/95 border border-rose-800 rounded-xl p-3 flex gap-2.5 text-rose-200 text-xs items-start z-10">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p>{cameraError}</p>
          </div>
        )}

        {/* White Studio Flash Overlay */}
        {flashActive && (
          <div className="absolute inset-0 bg-white z-40 transition-opacity duration-75" />
        )}

        {/* Large Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-30 animate-fade-in">
            <div className="text-center">
              <span className="inline-block font-mono font-bold text-gold text-9xl animate-scale-up tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                {countdown}
              </span>
              <p className="font-serif italic text-gold text-xl tracking-wide mt-2">
                Pose! Ambil gaya terbaikmu...
              </p>
              {sessionPhotosLeft > 0 && (
                <div className="mt-4 inline-flex items-center glass border-gold/30 rounded-full px-4 py-1 text-xs font-mono text-gold select-none">
                  FOTO KE {5 - sessionPhotosLeft} DARI 4
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voice Command visualizer HUD */}
        {settings.voiceTrigger && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 glass border-white/20 rounded-full px-3 py-1 text-[11px] font-mono text-white/90 shadow-luxe">
            <AudioLines className={`h-3 w-3 ${audioLevel > 20 ? 'text-red-500 animate-pulse' : 'text-gold'}`} />
            <span>Picu Suara:</span>
            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-75 ${audioLevel > settings.voiceThreshold ? 'bg-red-500' : 'bg-gold'}`}
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <span className={audioLevel > settings.voiceThreshold ? 'text-red-400 font-bold' : ''}>
              {audioLevel > settings.voiceThreshold ? 'POW!' : `${audioLevel}%`}
            </span>
          </div>
        )}

        {/* Snapshots progress indicator bar */}
        {isCapturing && sessionPhotosLeft > 0 && (
          <div className="absolute bottom-4 inset-x-4 z-20 glass border-white/20 rounded-xl p-2.5 flex items-center justify-between">
            <span className="font-sans font-medium text-xs text-white/80">Mengambil foto berseri...</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((num) => {
                const step = 4 - sessionPhotosLeft;
                const active = num <= step;
                return (
                  <div 
                    key={num} 
                    className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[9px] font-semibold border transition-all ${
                      active 
                        ? 'bg-gold border-gold text-slate-950' 
                        : 'glass text-white/40'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Shutter Button */}
      <div className="mt-5 flex gap-3">
        <button
          onClick={triggerSessionCountdown}
          disabled={isCapturing || !stream}
          className={`flex-1 flex items-center justify-center gap-3 font-sans font-semibold tracking-wider rounded-2xl py-4.5 text-center text-sm uppercase transition-all shadow-lg active:scale-[0.98] cursor-pointer cursor-allowed ${
            isCapturing 
              ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' 
              : 'bg-gold text-slate-950 hover:bg-[#E5C158] shadow-[#D4AF37]/20 hover:shadow-lg'
          }`}
        >
          <Camera className="h-5 w-5" />
          {isCapturing ? 'Menjepret...' : 'Mulai Sesi Foto Booth'}
        </button>
      </div>

      {/* Control Tabs Panel (Filters vs Pro Settings vs Chroma removal) */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex glass p-1.5 rounded-2xl select-none">
          <button
            onClick={() => setUiTab('filters')}
            className={`flex-1 flex gap-1.5 items-center justify-center py-2 px-1 text-xs font-sans rounded-xl font-medium transition-all cursor-pointer ${
              uiTab === 'filters' ? 'bg-gold text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Filter Estetik
          </button>
          <button
            onClick={() => setUiTab('pro')}
            className={`flex-1 flex gap-1.5 items-center justify-center py-2 px-1 text-xs font-sans rounded-xl font-medium transition-all cursor-pointer ${
              uiTab === 'pro' ? 'bg-gold text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Eksposur Pro & ISO
          </button>
          <button
            onClick={() => setUiTab('chroma')}
            className={`flex-1 flex gap-1.5 items-center justify-center py-2 px-1 text-xs font-sans rounded-xl font-medium transition-all cursor-pointer ${
              uiTab === 'chroma' ? 'bg-gold text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            Efek Background
          </button>
        </div>

        {/* Tab contents */}
        <div className="mt-4.5 min-h-[140px]">
          {/* Aesthetic Filters */}
          {uiTab === 'filters' && (
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5 animate-fade-in select-none">
              {[
                { type: 'none', label: 'Ultra Raw', desc: 'No Filter' },
                { type: 'rose-gold', label: 'Rose Gold', desc: 'Luxury Warm' },
                { type: 'monaco-noir', label: 'Noir Monaco', desc: 'Royal Mono' },
                { type: 'cyberpunk', label: 'Cyberpunk', desc: 'Futuristic' },
                { type: 'vhs-1994', label: 'Retro VHS', desc: 'Faded Glitch' },
                { type: 'cream-glow', label: 'Dreamy Cream', desc: 'Soft Glow' },
                { type: 'cinema-teal', label: 'Teal Shadow', desc: 'Cinematic' },
                { type: 'custom-pro', label: 'Custom Pro', desc: 'Manual Adjust' }
              ].map((f) => (
                <button
                  key={f.type}
                  onClick={() => setActiveFilter(f.type as FilterType)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${
                    activeFilter === f.type
                      ? 'bg-gold/15 border-gold text-gold shadow-luxe'
                      : 'glass border-white/5 text-white/50 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span className="font-sans font-medium text-[11px] truncate">{f.label}</span>
                  <span className="font-mono text-[8px] opacity-75 mt-0.5 truncate">{f.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Pro Settings */}
          {uiTab === 'pro' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 font-sans text-xs text-white/70 animate-fade-in">
              {/* Exposure */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span>Pencahayaan (Brightness)</span>
                  <span className="text-gold font-mono">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={settings.brightness}
                  onChange={(e) => setSettings(s => ({ ...s, brightness: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span>Kontras (Contrast)</span>
                  <span className="text-gold font-mono">{settings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={settings.contrast}
                  onChange={(e) => setSettings(s => ({ ...s, contrast: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span>Suhu Warna (WB Warmth)</span>
                  <span className="text-gold font-mono">{settings.warmth}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={settings.warmth}
                  onChange={(e) => setSettings(s => ({ ...s, warmth: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span>Saturasi Warna</span>
                  <span className="text-gold font-mono">{settings.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={settings.saturation}
                  onChange={(e) => setSettings(s => ({ ...s, saturation: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Pro ISO (Dials noise film simulation) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span>Manual ISO (Sensitivitas Grain)</span>
                  <span className="text-gold font-mono">ISO {settings.iso}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3200"
                  step="100"
                  value={settings.iso}
                  onChange={(e) => setSettings(s => ({ ...s, iso: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hands-Free Voice control & Sound command */}
              <div className="glass p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-[11px] block text-white/95">Shutter Kontrol Suara</label>
                    <p className="text-[9px] text-white/40">Picu jepretan secara otomatis hanya dengan suara</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.voiceTrigger}
                    onChange={(e) => setSettings(s => ({ ...s, voiceTrigger: e.target.checked }))}
                    className="h-4.5 w-4.5 text-gold focus:ring-0 border-white/20 bg-black/40 rounded-md cursor-pointer"
                  />
                </div>
                {settings.voiceTrigger && (
                  <div className="pt-1.5 border-t border-white/10">
                    <div className="flex justify-between text-[10px] text-white/50 mb-1">
                      <span>Sensitivitas Trigger Suara</span>
                      <span className="text-gold font-mono">{settings.voiceThreshold} dB</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="75"
                      value={settings.voiceThreshold}
                      onChange={(e) => setSettings(s => ({ ...s, voiceThreshold: parseInt(e.target.value) }))}
                      className="w-full h-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chroma background replacement removal */}
          {uiTab === 'chroma' && (
            <div className="space-y-4 animate-fade-in font-sans text-xs">
              <div className="flex items-center justify-between glass p-3.5 rounded-xl">
                <div>
                  <h4 className="font-semibold text-white/95 text-[11px]">Real-time Background Removal (Chroma-Key)</h4>
                  <p className="text-[9px] text-white/40">Ekstrak tubuh Anda dan tempatkan pada studio mewah secara digital</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.chromaKey}
                  onChange={(e) => setSettings(s => ({ ...s, chromaKey: e.target.checked }))}
                  className="h-4.5 w-4.5 text-gold focus:ring-0 border-white/20 bg-black/40 rounded-md cursor-pointer"
                />
              </div>

              {settings.chromaKey ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-5 gap-y-4 p-3 glass rounded-xl">
                  {/* Chroma color control */}
                  <div className="md:col-span-5 flex flex-col gap-2">
                    <span className="text-[10px] text-white/50 font-medium">1. Pilih Warna Layar Belakang</span>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.chromaColor}
                        onChange={(e) => setSettings(s => ({ ...s, chromaColor: e.target.value }))}
                        className="h-10 w-10 p-0 border border-white/20 bg-transparent rounded-lg cursor-pointer"
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <span className="font-mono text-[10px] text-white/85">{settings.chromaColor.toUpperCase()}</span>
                        <span className="text-[8px] text-white/45">Pilih warna tembok / layar (misal hijau/biru)</span>
                      </div>
                    </div>

                    <div className="mt-1 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-white/50">
                        <span>Toleransi Warna (Tolerance)</span>
                        <span className="text-gold font-mono">{settings.chromaTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="85"
                        value={settings.chromaTolerance}
                        onChange={(e) => setSettings(s => ({ ...s, chromaTolerance: parseInt(e.target.value) }))}
                        className="w-full h-1"
                      />
                    </div>
                  </div>

                  {/* Background backdrop selector */}
                  <div className="md:col-span-7 flex flex-col gap-2">
                    <span className="text-[10px] text-white/50 font-medium">2. Pilih Latar Belakang Mewah</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {BG_TEMPLATES.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSettings(s => ({ ...s, selectedBgId: b.id }))}
                          title={b.description}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all text-center select-none cursor-pointer ${
                            settings.selectedBgId === b.id
                              ? 'bg-gold/15 border-gold text-gold shadow-luxe'
                              : 'glass text-white/90 hover:border-white/20'
                          }`}
                        >
                          <span className="text-xl mb-1">{b.icon}</span>
                          <span className="text-[8.5px] truncate w-full px-1">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white/80 text-xs">
                  <span className="text-gold shrink-0">✨</span>
                  <p>Fitur Chroma-Key menggantikan latar belakang asli Anda dengan background buatan secara real-time. Untuk hasil terbaik, gunakan latar belakang berwarna solid.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden static canvas used for real snapshot pixel calculations */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
