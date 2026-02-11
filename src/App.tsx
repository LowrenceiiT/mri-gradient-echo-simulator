import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Cpu, Monitor, RotateCcw, Waves } from 'lucide-react';
import { KSpaceView } from './components/KSpaceView';
import { VectorView } from './components/VectorView';
import { SequenceParams, SequenceType, TissueParams } from './types';
import { calculateErnstAngle, calculateSignal, generateMultiCurveData } from './utils/physics';

const defaultSeq: SequenceParams = {
  tr: 150,
  te: 5,
  ti: 150,
  flipAngle: 60,
  sequenceType: 'spoiled',
  gzAmp: 1,
  gyAmp: 1,
  gxAmp: 1.2
};

const TISSUES: Record<string, TissueParams> = {
  WM: { t1: 600, t2: 80, t2star: 60, pd: 0.72 },
  GM: { t1: 950, t2: 100, t2star: 70, pd: 0.86 },
  CSF: { t1: 4500, t2: 2200, t2star: 400, pd: 1.0 },
  FAT: { t1: 250, t2: 85, t2star: 60, pd: 0.95 }
};

const sequenceLabels: Record<SequenceType, string> = {
  spoiled: 'Spoiled GRE (FLASH/SPGR)',
  bssfp: 'Balanced SSFP (TrueFISP)',
  fisp: 'FISP (Steady-State GRE)',
  inversion: 'Inversion Recovery (IR-GRE)'
};

const sequenceDescriptions: Record<SequenceType, string> = {
  spoiled: 'Transverse magnetization is destroyed (spoiled) after each TR. Pure T1/PD contrast.',
  bssfp: 'Balanced gradients preserve coherence. High SNR with T2/T1 weighted contrast.',
  fisp: 'Hybrid steady-state behavior with mixed T1 and T2* weighting.',
  inversion: '180° preparation pulse with TI-based nulling for selective suppression.'
};

const equationBySeq: Record<SequenceType, string> = {
  spoiled: 'S = S₀ · ((1 - e^(-TR/T1)) / (1 - cos(α)e^(-TR/T1))) · sin(α) · e^(-TE/T2*)',
  bssfp: 'S = S₀ · (sin(α)(1 - e^(-TR/T1))) / (1 - (e^(-TR/T1)-e^(-TR/T2))cos(α) - e^(-TR/T1)e^(-TR/T2)) · e^(-TE/T2)',
  fisp: 'S = S₀ · ((1 - e^(-TR/T1))sin(α)) / (1 - e^(-TR/T1)cos(α) - e^(-TR/T2)(e^(-TR/T1)-cos(α))) · e^(-TE/T2*)',
  inversion: 'S = S₀ · |1 - 2e^(-TI/T1) + e^(-TR/T1)| · sin(α) · e^(-TE/T2*)'
};

type ChartType = 'flipAngle' | 'tr' | 'te' | 'contrast' | 'relaxation' | 't2relaxation' | 'ti';

const chartTabs: Array<{ id: ChartType; label: string }> = [
  { id: 'flipAngle', label: 'Signal vs α' },
  { id: 'tr', label: 'Signal vs TR' },
  { id: 'te', label: 'Signal vs TE' },
  { id: 'contrast', label: 'Contrast' },
  { id: 'relaxation', label: 'T1 Relax' },
  { id: 't2relaxation', label: 'T2 Relax' },
  { id: 'ti', label: 'Signal vs TI' }
];

const uiCurveColors: Record<string, string> = {
  CSF: '#38bdf8',
  FAT: '#ec4899',
  GM: '#34d399',
  WM: '#facc15',
  Contrast: '#34d399'
};

const toPath = (pts: Array<{ x: number; y: number }>) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

const ChartPanel: React.FC<{ chartType: ChartType; setChartType: (t: ChartType) => void; seqParams: SequenceParams }> = ({ chartType, setChartType, seqParams }) => {
  const data = useMemo(() => generateMultiCurveData(chartType, seqParams, TISSUES), [chartType, seqParams]);
  const keys = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).filter((k) => k !== 'x');
  }, [data]);

  const bounds = useMemo(() => {
    if (!data.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    const xs = data.map((d) => d.x);
    const ys = data.flatMap((d) => keys.map((k) => d[k] ?? 0));
    const maxY = Math.max(...ys, 0.2);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: 0, maxY };
  }, [data, keys]);

  const w = 700;
  const h = 380;
  const m = { l: 40, r: 12, t: 18, b: 40 };

  const scaleX = (x: number) => m.l + ((x - bounds.minX) / Math.max(bounds.maxX - bounds.minX, 1e-6)) * (w - m.l - m.r);
  const scaleY = (y: number) => h - m.b - ((y - bounds.minY) / Math.max(bounds.maxY - bounds.minY, 1e-6)) * (h - m.t - m.b);

  const currentSignal = calculateSignal(seqParams.tr, seqParams.te, seqParams.flipAngle, TISSUES.GM, seqParams.sequenceType, seqParams.ti);

  return (
    <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex overflow-auto border-b border-zinc-800">
        {chartTabs.map((tab) => (
          <button key={tab.id} onClick={() => setChartType(tab.id)} className={`px-4 py-3 text-sm whitespace-nowrap ${chartType === tab.id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[430px] bg-[#060913] rounded-xl">
          {[0.2, 0.4, 0.6, 0.8].map((f) => {
            const y = m.t + f * (h - m.t - m.b);
            return <line key={f} x1={m.l} x2={w - m.r} y1={y} y2={y} stroke="#2e3446" strokeDasharray="4 4" />;
          })}
          {[0.25, 0.5, 0.75].map((f) => {
            const x = m.l + f * (w - m.l - m.r);
            return <line key={f} y1={m.t} y2={h - m.b} x1={x} x2={x} stroke="#2e3446" strokeDasharray="4 4" />;
          })}
          <line x1={m.l} x2={m.l} y1={m.t} y2={h - m.b} stroke="#95a0b8" />
          <line x1={m.l} x2={w - m.r} y1={h - m.b} y2={h - m.b} stroke="#95a0b8" />

          {keys.map((key) => {
            const points = data.map((d) => ({ x: scaleX(d.x), y: scaleY(d[key] || 0) }));
            return <path key={key} d={toPath(points)} stroke={uiCurveColors[key] || '#a78bfa'} fill="none" strokeWidth={key === 'GM' ? 4 : 2.2} opacity={key === 'GM' ? 1 : 0.85} />;
          })}

          {chartType === 'flipAngle' && (
            <>
              <line x1={scaleX(calculateErnstAngle(seqParams.tr, TISSUES.GM.t1))} x2={scaleX(calculateErnstAngle(seqParams.tr, TISSUES.GM.t1))} y1={m.t} y2={h - m.b} stroke="#10b981" strokeDasharray="5 5" />
              <text x={scaleX(calculateErnstAngle(seqParams.tr, TISSUES.GM.t1)) - 14} y={m.t + 14} fill="#10b981" fontSize="12">Ernst</text>
            </>
          )}

          <circle cx={scaleX(chartType === 'flipAngle' ? seqParams.flipAngle : data[Math.floor(data.length * 0.65)]?.x || 0)} cy={scaleY(currentSignal)} r={5} fill="#facc15" stroke="#fff" strokeWidth={1.5} />
          <text x={w - 150} y={h - 8} fill="#8f9ab4" fontSize="12">{chartTabs.find((t) => t.id === chartType)?.label}</text>
        </svg>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [seqParams, setSeqParams] = useState<SequenceParams>(defaultSeq);
  const [timeInTR, setTimeInTR] = useState(0);
  const [activeTissue, setActiveTissue] = useState<'WM' | 'GM' | 'CSF' | 'FAT'>('GM');
  const [activeMainTab, setActiveMainTab] = useState<'vector' | 'kspace'>('kspace');
  const [chartType, setChartType] = useState<ChartType>('flipAngle');

  useEffect(() => {
    const id = window.setInterval(() => setTimeInTR((p) => (p + 1) % 101), Math.max(seqParams.tr / 100, 20));
    return () => clearInterval(id);
  }, [seqParams.tr]);

  const selectedTissue = TISSUES[activeTissue];
  const ernst = calculateErnstAngle(seqParams.tr, selectedTissue.t1);
  const signal = calculateSignal(seqParams.tr, seqParams.te, seqParams.flipAngle, selectedTissue, seqParams.sequenceType, seqParams.ti);

  return (
    <div className="min-h-screen bg-[#090b11] text-zinc-100">
      <header className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-900/60">
        <div className="text-sm text-zinc-500">GRE Simulator</div>
        <h1 className="text-xl md:text-3xl font-medium">MRI Gradient Echo Physics Simulator</h1>
        <div className="flex items-center gap-4 text-zinc-300 text-sm"><Monitor size={16} /> Device</div>
      </header>

      <div className="border-b border-zinc-800 py-4 text-center text-lg md:text-5xl italic text-zinc-300 bg-[#12141d]">
        <span className="text-zinc-100">{equationBySeq[seqParams.sequenceType]}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[330px_1fr] min-h-[calc(100vh-112px)]">
        <aside className="border-r border-zinc-800 bg-zinc-900/55 p-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-4xl font-bold"><Waves className="text-cyan-400" /> GRE Simulator</div>
            <select className="mt-3 w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2" defaultValue="normal">
              <option value="normal">Normal Mode</option>
              <option value="expert">Expert Mode</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-zinc-400 tracking-widest">EQUATION MODEL</div>
            <select value={seqParams.sequenceType} onChange={(e) => setSeqParams((s) => ({ ...s, sequenceType: e.target.value as SequenceType }))} className="w-full bg-zinc-800 border border-cyan-500/70 rounded px-3 py-2">
              {Object.entries(sequenceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <p className="text-sm text-zinc-400">{sequenceDescriptions[seqParams.sequenceType]}</p>
          </div>

          <div>
            <div className="text-xs text-zinc-400 tracking-widest mb-3">TISSUE PRESETS</div>
            <div className="grid grid-cols-2 gap-2">
              {(['WM', 'GM', 'CSF', 'FAT'] as const).map((name) => (
                <button key={name} onClick={() => setActiveTissue(name)} className={`py-2 rounded border ${activeTissue === name ? 'border-cyan-400 bg-cyan-900/30 text-cyan-300' : 'border-zinc-700 text-zinc-300'}`}>{name}</button>
              ))}
            </div>
            <label className="block mt-3 text-sm text-zinc-400">T1 (Longitudinal)
              <input type="range" min={150} max={4500} value={selectedTissue.t1} onChange={() => undefined} className="w-full accent-cyan-400" disabled />
              <span className="text-cyan-400 text-xs">{selectedTissue.t1} ms</span>
            </label>
          </div>

          <div>
            <div className="text-xs text-zinc-400 tracking-widest mb-3">SEQUENCE PARAMETERS</div>
            <div className="space-y-3 text-sm">
              <label className="block">Repetition Time (TR) <span className="text-cyan-400 float-right">{seqParams.tr} ms</span><input type="range" min={5} max={3000} value={seqParams.tr} onChange={(e) => setSeqParams((s) => ({ ...s, tr: Number(e.target.value) }))} className="w-full accent-cyan-400" /></label>
              <label className="block">Echo Time (TE) <span className="text-cyan-400 float-right">{seqParams.te} ms</span><input type="range" min={1} max={200} value={seqParams.te} onChange={(e) => setSeqParams((s) => ({ ...s, te: Number(e.target.value) }))} className="w-full accent-cyan-400" /></label>
              <label className="block">Flip Angle (α) <span className="text-cyan-400 float-right">{seqParams.flipAngle}°</span><input type="range" min={1} max={90} value={seqParams.flipAngle} onChange={(e) => setSeqParams((s) => ({ ...s, flipAngle: Number(e.target.value) }))} className="w-full accent-cyan-400" /></label>
              {seqParams.sequenceType === 'inversion' && <label className="block">Inversion Time (TI) <span className="text-cyan-400 float-right">{seqParams.ti} ms</span><input type="range" min={0} max={4000} value={seqParams.ti} onChange={(e) => setSeqParams((s) => ({ ...s, ti: Number(e.target.value) }))} className="w-full accent-cyan-400" /></label>}
              <div className="text-xs text-emerald-400">Ernst Angle (for T1): {ernst.toFixed(1)}°</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-400 tracking-widest mb-3">GRADIENT AMPLITUDES</div>
            <div className="space-y-2 text-sm">
              <label>Gz (Slice) <span className="float-right">{seqParams.gzAmp.toFixed(1)}x</span><input type="range" min={0.1} max={2} step={0.1} value={seqParams.gzAmp} onChange={(e) => setSeqParams((s) => ({ ...s, gzAmp: Number(e.target.value) }))} className="w-full accent-emerald-400" /></label>
              <label>Gy (Phase) <span className="float-right">{seqParams.gyAmp.toFixed(1)}x</span><input type="range" min={0.1} max={2} step={0.1} value={seqParams.gyAmp} onChange={(e) => setSeqParams((s) => ({ ...s, gyAmp: Number(e.target.value) }))} className="w-full accent-blue-400" /></label>
              <label>Gx (Freq) <span className="float-right">{seqParams.gxAmp.toFixed(1)}x</span><input type="range" min={0.1} max={2} step={0.1} value={seqParams.gxAmp} onChange={(e) => setSeqParams((s) => ({ ...s, gxAmp: Number(e.target.value) }))} className="w-full accent-red-400" /></label>
            </div>
          </div>
        </aside>

        <main className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex gap-6 text-lg">
              <button onClick={() => setActiveMainTab('vector')} className={`${activeMainTab === 'vector' ? 'text-cyan-400' : 'text-zinc-400'} flex items-center gap-2`}><Activity size={16} /> Vector Physics</button>
              <button onClick={() => setActiveMainTab('kspace')} className={`${activeMainTab === 'kspace' ? 'text-fuchsia-400' : 'text-zinc-400'} flex items-center gap-2`}><Cpu size={16} /> K-Space & Encoding</button>
            </div>
            <button onClick={() => setTimeInTR(0)} className="p-2 rounded bg-zinc-800 text-zinc-300"><RotateCcw size={16} /></button>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-[1fr_1fr] gap-4 min-h-[740px]">
            <div className="space-y-3">
              {activeMainTab === 'vector' ? (
                <div className="h-[620px]"><VectorView seqParams={seqParams} tissueParams={selectedTissue} timeInTR={timeInTR} /></div>
              ) : (
                <div className="h-[620px]"><KSpaceView seqParams={seqParams} timeInTR={timeInTR} /></div>
              )}
              <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/70 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400 tracking-widest">SIGNAL INTENSITY</div>
                  <div className="text-zinc-400">Steady State Amplitude</div>
                </div>
                <div className="text-5xl font-mono text-emerald-300">● {signal.toFixed(3)}</div>
              </div>
            </div>

            <ChartPanel chartType={chartType} setChartType={setChartType} seqParams={seqParams} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
