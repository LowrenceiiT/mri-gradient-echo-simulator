import React, { useEffect, useRef, useState } from 'react';
import { SequenceParams, TissueParams } from '../types';
import { Rotate3d, Square, Home, ArrowDownToLine, Eye } from 'lucide-react';

interface VectorViewProps {
  seqParams: SequenceParams;
  tissueParams: TissueParams;
  timeInTR: number;
}

export const VectorView: React.FC<VectorViewProps> = ({ seqParams, tissueParams, timeInTR }) => {
  const [is3D, setIs3D] = useState(false);
  const plotlyRef = useRef<HTMLDivElement>(null);

  let Mz_available = 1;
  const E1 = Math.exp(-seqParams.tr / tissueParams.t1);

  if (seqParams.sequenceType === 'inversion') {
    const E_TI = Math.exp(-seqParams.ti / tissueParams.t1);
    Mz_available = 1 - 2 * E_TI + E1;
  } else {
    const alpha0 = (seqParams.flipAngle * Math.PI) / 180;
    const cosA = Math.cos(alpha0);
    Mz_available = (1 - E1) / (1 - cosA * E1);
  }

  const alphaRad = (seqParams.flipAngle * Math.PI) / 180;
  const mzStart = Mz_available * Math.cos(alphaRad);
  const mxyStart = Math.abs(Mz_available * Math.sin(alphaRad));

  const timeMs = (timeInTR / 100) * seqParams.tr;
  const recoveryFactor = Math.exp(-timeMs / tissueParams.t1);
  const decayConst = seqParams.sequenceType === 'bssfp' ? tissueParams.t2 : tissueParams.t2star;
  const decayFactor = Math.exp(-timeMs / decayConst);

  const mzCurrent = 1 - (1 - mzStart) * recoveryFactor;
  const mxyCurrent = mxyStart * decayFactor;
  const phase = timeMs * 0.1;

  const setCameraView = (view: 'iso' | 'top' | 'side') => {
    if (!plotlyRef.current || !window.Plotly) return;

    let camera: unknown = {};
    switch (view) {
      case 'top':
        camera = { eye: { x: 0, y: 0, z: 2.2 }, up: { x: 0, y: 1, z: 0 } };
        break;
      case 'side':
        camera = { eye: { x: 2.2, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } };
        break;
      case 'iso':
      default:
        camera = { eye: { x: 1.5, y: 1.5, z: 1.2 }, up: { x: 0, y: 0, z: 1 } };
        break;
    }

    window.Plotly.relayout(plotlyRef.current, { 'scene.camera': camera });
  };

  useEffect(() => {
    if (!is3D || !window.Plotly || !plotlyRef.current) return;

    const mx = mxyCurrent * Math.cos(phase);
    const my = mxyCurrent * Math.sin(phase);

    const data: unknown[] = [
      {
        type: 'scatter3d',
        mode: 'lines',
        x: [0, 0],
        y: [0, 0],
        z: [0, mzCurrent],
        line: { width: 6, color: '#10b981' },
        name: 'Mz'
      },
      {
        type: 'scatter3d',
        mode: 'lines',
        x: [0, mx],
        y: [0, 0],
        z: [0, 0],
        line: { width: 5, color: '#ef4444' },
        name: 'Mx'
      },
      {
        type: 'scatter3d',
        mode: 'lines',
        x: [0, 0],
        y: [0, my],
        z: [0, 0],
        line: { width: 5, color: '#3b82f6' },
        name: 'My'
      },
      {
        type: 'scatter3d',
        mode: 'lines+markers',
        x: [0, mx],
        y: [0, my],
        z: [0, mzCurrent],
        line: { width: 8, color: '#eab308' },
        marker: { size: 4, color: '#eab308' },
        name: 'NMV'
      }
    ];

    const layout: unknown = {
      margin: { l: 0, r: 0, b: 0, t: 0 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      uirevision: 'mri_sim_view',
      scene: {
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.2 }
        },
        xaxis: { title: 'Mx', range: [-1.1, 1.1], gridcolor: '#3f3f46', zerolinecolor: '#71717a', tickfont: { color: '#71717a' } },
        yaxis: { title: 'My', range: [-1.1, 1.1], gridcolor: '#3f3f46', zerolinecolor: '#71717a', tickfont: { color: '#71717a' } },
        zaxis: { title: 'Mz', range: [-1.2, 1.2], gridcolor: '#3f3f46', zerolinecolor: '#71717a', tickfont: { color: '#71717a' } },
        aspectmode: 'cube'
      },
      showlegend: true,
      legend: { x: 0, y: 1, font: { color: '#d4d4d8' }, bgcolor: 'rgba(0,0,0,0.5)' }
    };

    const config: unknown = {
      displayModeBar: false,
      displaylogo: false,
      responsive: true
    };

    window.Plotly.react(plotlyRef.current, data, layout, config);
  }, [is3D, mzCurrent, mxyCurrent, phase]);

  const center = 150;
  const radius = 100;
  const mzHeight = mzCurrent * radius;
  const mxyLen = mxyCurrent * radius;

  const isoAngle = 30 * (Math.PI / 180);
  const cosIso = Math.cos(isoAngle);
  const sinIso = Math.sin(isoAngle);

  const project = (x: number, y: number, z: number) => ({
    x: center + (x - y) * cosIso,
    y: center + (x + y) * sinIso - z
  });

  const mxVal = mxyCurrent * Math.cos(phase);
  const myVal = mxyCurrent * Math.sin(phase);

  const origin = project(0, 0, 0);
  const pMz = project(0, 0, mzHeight);
  const pMxy = project((mxVal / (mxyCurrent || 1)) * mxyLen, (myVal / (mxyCurrent || 1)) * mxyLen, 0);
  const pNMV = project(mxVal * radius, myVal * radius, mzHeight);

  const axisLen = 120;
  const pXAxis = project(axisLen, 0, 0);
  const pYAxis = project(0, axisLen, 0);
  const pZAxis = project(0, 0, axisLen);

  return (
    <div className="relative w-full h-full flex flex-col bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden" id="view-vector">
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start pointer-events-none">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">Net Magnetization</h3>
          <p className="text-xs text-zinc-500">Real-time Simulation</p>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => setIs3D(false)} className={`p-1.5 rounded transition-colors ${!is3D ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`} title="2D Vector View">
            <Square size={16} />
          </button>
          <button onClick={() => setIs3D(true)} className={`p-1.5 rounded transition-colors ${is3D ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`} title="3D Plot View">
            <Rotate3d size={16} />
          </button>
        </div>
      </div>

      <div className="absolute top-14 right-4 z-10 text-right space-y-1 pointer-events-none">
        <div className={`text-xs font-mono drop-shadow-md ${mzCurrent < 0 ? 'text-red-400' : 'text-emerald-500'}`}>Mz: {(mzCurrent * 100).toFixed(1)}%</div>
        <div className="text-xs text-cyan-400 font-mono drop-shadow-md">Mxy: {(mxyCurrent * 100).toFixed(1)}%</div>
      </div>

      {is3D && (
        <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 backdrop-blur-sm">
          <button onClick={() => setCameraView('iso')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Reset View">
            <Home size={18} />
          </button>
          <button onClick={() => setCameraView('top')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Top View (Mxy Plane)">
            <ArrowDownToLine size={18} />
          </button>
          <button onClick={() => setCameraView('side')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Side View (Flip Angle)">
            <Eye size={18} />
          </button>
        </div>
      )}

      <div className="flex-1 w-full h-full relative">
        {is3D ? (
          <div ref={plotlyRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
              <line x1={origin.x} y1={origin.y} x2={pZAxis.x} y2={pZAxis.y} stroke="#3f3f46" strokeWidth="1" />
              <line x1={origin.x} y1={origin.y} x2={pXAxis.x} y2={pXAxis.y} stroke="#3f3f46" strokeWidth="1" />
              <line x1={origin.x} y1={origin.y} x2={pYAxis.x} y2={pYAxis.y} stroke="#3f3f46" strokeWidth="1" />
              <line x1={origin.x} y1={origin.y} x2={pMz.x} y2={pMz.y} stroke="#10b981" strokeWidth="3" strokeOpacity="0.5" strokeDasharray="4 4" />
              <line x1={origin.x} y1={origin.y} x2={pMxy.x} y2={pMxy.y} stroke="#22d3ee" strokeWidth="3" strokeOpacity="0.5" strokeDasharray="4 4" />
              <line x1={origin.x} y1={origin.y} x2={pNMV.x} y2={pNMV.y} stroke="#eab308" strokeWidth="4" />
            </svg>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-800">
        <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${Math.min(timeInTR, 100)}%` }} />
        <div className="absolute top-0 h-2 w-0.5 bg-red-500 -mt-0.5" style={{ left: `${Math.min((seqParams.te / seqParams.tr) * 100, 100)}%` }} />
      </div>
    </div>
  );
};
