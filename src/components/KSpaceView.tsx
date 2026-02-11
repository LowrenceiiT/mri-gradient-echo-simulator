import React, { useEffect, useState } from 'react';
import { Grid3X3, Pause, Play, ScanLine, TrendingUp, Waves } from 'lucide-react';
import { SequenceParams } from '../types';

interface KSpaceViewProps {
  seqParams: SequenceParams;
  timeInTR: number;
}

const TOTAL_LINES = 32;
const T_RF_START = 5;
const T_RF_END = 15;
const T_PHASE_START = 20;
const T_PHASE_END = 35;
const T_READ_START = 45;
const T_READ_END = 75;
const T_SPOILER_START = 90;

export const KSpaceView: React.FC<KSpaceViewProps> = ({ seqParams, timeInTR }) => {
  const [kSpaceLine, setKSpaceLine] = useState(Math.floor(TOTAL_LINES / 2));
  const [isAcquiring, setIsAcquiring] = useState(true);

  useEffect(() => {
    if (!isAcquiring) return;
    const id = window.setInterval(() => setKSpaceLine((prev) => (prev + 1) % TOTAL_LINES), 700);
    return () => window.clearInterval(id);
  }, [isAcquiring]);

  const isAcquiringSignal = timeInTR >= T_READ_START && timeInTR <= T_READ_END;

  const kyVisual = 1 - 2 * (kSpaceLine / (TOTAL_LINES - 1));
  const kyPhysics = kyVisual * seqParams.gyAmp;

  let kx = 0;
  let ky = 0;

  if (timeInTR < T_PHASE_START) {
    kx = 0;
    ky = 0;
  } else if (timeInTR >= T_PHASE_START && timeInTR <= T_PHASE_END) {
    const progress = (timeInTR - T_PHASE_START) / (T_PHASE_END - T_PHASE_START);
    ky = progress * kyVisual;
    kx = progress * -1;
  } else if (timeInTR > T_PHASE_END && timeInTR < T_READ_START) {
    ky = kyVisual;
    kx = -1;
  } else if (timeInTR >= T_READ_START && timeInTR <= T_READ_END) {
    const progress = (timeInTR - T_READ_START) / (T_READ_END - T_READ_START);
    ky = kyVisual;
    kx = -1 + progress * 2;
  } else if (timeInTR > T_READ_END) {
    ky = kyVisual;
    kx = 1;
  }

  if (seqParams.sequenceType === 'spoiled' && timeInTR >= T_SPOILER_START) {
    kx = 0;
    ky = 0;
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-hidden p-1">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col h-1/2 min-h-[250px] relative" id="view-kspace-psd">
        <h3 className="text-sm font-semibold text-zinc-400 absolute top-3 left-4 flex items-center gap-2">
          <Waves size={16} /> Pulse Sequence Diagram
        </h3>

        <div className="flex-1 flex flex-col justify-center gap-6 mt-6">
          <div className="relative h-8 flex items-center border-b border-zinc-800/50">
            <span className="w-12 text-xs text-zinc-500 font-mono">RF</span>
            <div className="flex-1 h-full relative">
              <div className="absolute left-[5%] w-[10%] h-full flex items-center justify-center">
                <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                  <path d="M0,25 Q25,25 35,5 Q50,-30 65,5 Q75,25 100,25" fill="none" stroke="#eab308" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative h-8 flex items-center border-b border-zinc-800/50">
            <span className="w-12 text-xs text-zinc-500 font-mono">Gz</span>
            <div className="flex-1 h-full relative flex items-center">
              <div className="h-[1px] w-full bg-zinc-700" />
              <div
                className={`absolute border border-emerald-500 bg-emerald-500/20 transition-all ${timeInTR >= T_RF_START && timeInTR <= T_RF_END ? 'brightness-150' : ''}`}
                style={{ height: `${24 * seqParams.gzAmp}px`, left: `${T_RF_START}%`, width: `${T_RF_END - T_RF_START}%` }}
              />
              <div
                className="absolute border border-emerald-500 bg-emerald-500/20"
                style={{
                  left: `${T_RF_END}%`,
                  width: `${T_PHASE_START - T_RF_END}%`,
                  height: `${24 * seqParams.gzAmp}px`,
                  marginTop: `${24 * seqParams.gzAmp}px`
                }}
              />
              {seqParams.sequenceType === 'spoiled' && (
                <div className="absolute w-[8%] h-full flex flex-col items-center justify-center -mt-6" style={{ left: `${T_SPOILER_START}%` }}>
                  <span className={`text-[9px] font-bold font-mono mb-1 transition-colors ${timeInTR >= 90 ? 'text-emerald-400' : 'text-emerald-500/50'}`}>SPOILER</span>
                  <div
                    className={`w-full border border-emerald-500 bg-emerald-500/20 transition-all duration-75 ${timeInTR >= 90 ? 'brightness-150 bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''}`}
                    style={{ height: `${32 * seqParams.gzAmp}px` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="relative h-8 flex items-center border-b border-zinc-800/50">
            <span className="w-12 text-xs text-blue-400 font-mono font-bold">Gy</span>
            <div className="flex-1 h-full relative flex items-center">
              <div className="h-[1px] w-full bg-zinc-700" />
              <div
                className="absolute border border-blue-500 bg-blue-500/30 transition-all duration-75"
                style={{
                  left: `${T_PHASE_START}%`,
                  width: `${T_PHASE_END - T_PHASE_START}%`,
                  height: `${Math.abs(kyPhysics * 24)}px`,
                  marginTop: kyPhysics > 0 ? `-${Math.abs(kyPhysics * 24)}px` : `${Math.abs(kyPhysics * 24)}px`,
                  borderColor: timeInTR >= T_PHASE_START && timeInTR <= T_PHASE_END ? '#60a5fa' : '#3b82f6',
                  boxShadow: timeInTR >= T_PHASE_START && timeInTR <= T_PHASE_END ? '0 0 10px #3b82f6' : 'none'
                }}
              />
              {seqParams.sequenceType === 'bssfp' && (
                <div
                  className="absolute border border-blue-500 bg-blue-500/10 opacity-50"
                  style={{
                    left: `${T_SPOILER_START}%`,
                    width: '5%',
                    height: `${Math.abs(kyPhysics * 24)}px`,
                    marginTop: kyPhysics > 0 ? `${Math.abs(kyPhysics * 24)}px` : `-${Math.abs(kyPhysics * 24)}px`
                  }}
                />
              )}
            </div>
          </div>

          <div className="relative h-8 flex items-center border-b border-zinc-800/50">
            <span className="w-12 text-xs text-red-400 font-mono font-bold">Gx</span>
            <div className="flex-1 h-full relative flex items-center">
              <div className="h-[1px] w-full bg-zinc-700" />
              <div
                className="absolute border border-red-500 bg-red-500/20"
                style={{
                  left: `${T_PHASE_START}%`,
                  width: `${T_PHASE_END - T_PHASE_START}%`,
                  height: `${16 * seqParams.gxAmp}px`,
                  marginTop: `${16 * seqParams.gxAmp}px`
                }}
              />
              <div
                className={`absolute border border-red-500 bg-red-500/20 transition-all ${isAcquiringSignal ? 'brightness-125 bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}
                style={{
                  left: `${T_READ_START}%`,
                  width: `${T_READ_END - T_READ_START}%`,
                  height: `${24 * seqParams.gxAmp}px`,
                  marginTop: `-${24 * seqParams.gxAmp}px`
                }}
              />
            </div>
          </div>

          <div className="relative h-8 flex items-center">
            <span className="w-12 text-xs text-zinc-500 font-mono">ADC</span>
            <div className="flex-1 h-full relative flex items-center">
              <div className="h-[1px] w-full bg-zinc-700" />
              {isAcquiringSignal && (
                <div className="absolute h-full flex items-center justify-center animate-pulse" style={{ left: `${T_READ_START}%`, width: `${T_READ_END - T_READ_START}%` }}>
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path d="M0,25 C25,25 40,5 50,5 C60,5 75,45 100,25" fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-0 bottom-0 w-[2px] bg-yellow-400 z-10 shadow-[0_0_10px_#eab308]" style={{ left: `calc(3rem + ${timeInTR} * (100% - 3rem) / 100)` }} />
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-[250px]">
        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-center relative overflow-hidden" id="view-kspace-grid">
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <ScanLine size={16} /> K-Space
            </h3>
          </div>

          <div className="absolute top-3 right-4 flex items-center gap-3">
            <div className="flex bg-zinc-800 rounded-md p-0.5">
              <button
                onClick={() => setIsAcquiring(!isAcquiring)}
                className={`p-1 rounded ${isAcquiring ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                title={isAcquiring ? 'Pause Acquisition' : 'Resume Auto-Acquisition'}
              >
                {isAcquiring ? <Pause size={12} /> : <Play size={12} />}
              </button>
            </div>
          </div>

          <div className="mt-8 relative w-48 h-48 bg-black border border-zinc-700 grid" style={{ gridTemplateRows: `repeat(${TOTAL_LINES}, 1fr)` }}>
            {Array.from({ length: TOTAL_LINES }).map((_, i) => (
              <div key={i} className={`w-full border-b border-zinc-800/30 transition-colors duration-300 ${i < kSpaceLine ? 'bg-zinc-800/80' : ''}`} />
            ))}

            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-zinc-600" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-zinc-600" />

            <div
              className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#eab308] z-50 transition-none"
              style={{
                left: `${(kx + 1) * 50}%`,
                top: `${(kSpaceLine / (TOTAL_LINES - 1)) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />

            {timeInTR > T_PHASE_START && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                <line
                  x1="50%"
                  y1="50%"
                  x2={`${(kx + 1) * 50}%`}
                  y2={`${(kSpaceLine / (TOTAL_LINES - 1)) * 100}%`}
                  stroke="#eab308"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              </svg>
            )}

            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-blue-400">ky (Phase)</span>
            <span className="absolute top-1/2 -right-6 -translate-y-1/2 text-[10px] text-red-400 rotate-90">kx (Freq)</span>
          </div>

          <div className="w-48 mt-4 flex flex-col gap-2">
            <input
              type="range"
              min="0"
              max={TOTAL_LINES - 1}
              step="1"
              value={kSpaceLine}
              onChange={(e) => {
                setIsAcquiring(false);
                setKSpaceLine(parseInt(e.target.value, 10));
              }}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>
                Line: <span className="text-yellow-400">{kSpaceLine}</span>
              </span>
              <span>Amp: {kyPhysics.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-center relative" id="view-kspace-physics">
          <h3 className="text-sm font-semibold text-zinc-400 absolute top-3 left-4 flex items-center gap-2">
            <Grid3X3 size={16} /> Spatial Encoding Physics
          </h3>

          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-5 gap-3 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              {Array.from({ length: 25 }).map((_, i) => {
                const row = Math.floor(i / 5);
                const col = i % 5;
                const rowCenterOffset = row - 2;
                const colCenterOffset = col - 2;
                const phaseContribution = -rowCenterOffset * (kyPhysics * Math.PI);
                const freqContribution = colCenterOffset * (kx * Math.PI);
                const angle = phaseContribution + freqContribution;
                const alignment = Math.cos(angle);
                const isCoherent = alignment > 0.8;

                return (
                  <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center relative overflow-hidden">
                    <div
                      className={`w-full h-[2px] ${isCoherent && isAcquiringSignal ? 'bg-emerald-300 shadow-[0_0_5px_#6ee7b7]' : 'bg-emerald-600'} absolute top-1/2 left-1/2 origin-left`}
                      style={{ transform: `rotate(${angle}rad)` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full absolute -right-0.5 -top-0.5 bg-emerald-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-2 right-4 text-[10px] text-zinc-600 flex gap-2">
            <span className="flex items-center gap-1">
              <TrendingUp size={10} /> Phase (Y)
            </span>
            <span className="flex items-center gap-1">
              <Waves size={10} /> Freq (X)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
