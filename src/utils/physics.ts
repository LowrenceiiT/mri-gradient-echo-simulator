import { TissueParams, SequenceParams, SequenceType } from '../types';

export const calculateSignal = (
  tr: number,
  te: number,
  flipAngleDeg: number,
  tissue: TissueParams,
  type: SequenceType = 'spoiled',
  ti: number = 0
): number => {
  if (tr <= 0) return 0;

  const alphaRad = (flipAngleDeg * Math.PI) / 180;
  const sinAlpha = Math.sin(alphaRad);
  const cosAlpha = Math.cos(alphaRad);

  const E1 = Math.exp(-tr / tissue.t1);
  const E2 = Math.exp(-tr / tissue.t2);
  const E2star = Math.exp(-te / tissue.t2star);

  if (type === 'spoiled') {
    const denominator = 1 - cosAlpha * E1;
    if (Math.abs(denominator) < 1e-6) return 0;
    const Mz_ss = (1 - E1) / denominator;
    return Math.max(0, tissue.pd * Mz_ss * sinAlpha * E2star);
  }

  if (type === 'bssfp') {
    const numerator = (1 - E1) * sinAlpha;
    const denominator = 1 - (E1 - E2) * cosAlpha - E1 * E2;
    if (Math.abs(denominator) < 1e-6) return 0;
    const decay = Math.exp(-te / tissue.t2);
    return Math.max(0, tissue.pd * (numerator / denominator) * decay);
  }

  if (type === 'fisp') {
    const numerator = (1 - E1) * sinAlpha;
    const denominator = 1 - E1 * cosAlpha - E2 * (E1 - cosAlpha);
    if (Math.abs(denominator) < 1e-6) return 0;
    return Math.max(0, tissue.pd * (numerator / denominator) * E2star);
  }

  if (type === 'inversion') {
    const E_TI = Math.exp(-ti / tissue.t1);
    const Mz_TI = 1 - 2 * E_TI + E1;
    return Math.max(0, tissue.pd * Math.abs(Mz_TI) * sinAlpha * E2star);
  }

  return 0;
};

export const calculateErnstAngle = (tr: number, t1: number): number => {
  if (tr <= 0 || t1 <= 0) return 0;
  const E1 = Math.exp(-tr / t1);
  const angleRad = Math.acos(E1);
  return (angleRad * 180) / Math.PI;
};

export const generateMultiCurveData = (
  chartType: 'flipAngle' | 'tr' | 'te' | 'contrast' | 'relaxation' | 't2relaxation' | 'ti',
  params: SequenceParams,
  tissues: Record<string, TissueParams>
) => {
  const data: Array<Record<string, number>> = [];
  const tissueKeys = Object.keys(tissues);

  if (chartType === 'flipAngle' || chartType === 'contrast') {
    for (let angle = 0; angle <= 90; angle += 2) {
      const point: Record<string, number> = { x: angle };
      if (chartType === 'contrast') {
        const sGM = calculateSignal(params.tr, params.te, angle, tissues.GM, params.sequenceType, params.ti);
        const sWM = calculateSignal(params.tr, params.te, angle, tissues.WM, params.sequenceType, params.ti);
        point.Contrast = Math.abs(sGM - sWM);
      } else {
        tissueKeys.forEach((key) => {
          point[key] = calculateSignal(params.tr, params.te, angle, tissues[key], params.sequenceType, params.ti);
        });
      }
      data.push(point);
    }
  } else if (chartType === 'tr') {
    const steps = [0, 5, 10, 20, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000];
    for (const tr of steps) {
      const point: Record<string, number> = { x: tr };
      tissueKeys.forEach((key) => {
        point[key] = calculateSignal(tr, params.te, params.flipAngle, tissues[key], params.sequenceType, params.ti);
      });
      data.push(point);
    }
  } else if (chartType === 'te') {
    for (let te = 0; te <= 200; te += 5) {
      const point: Record<string, number> = { x: te };
      tissueKeys.forEach((key) => {
        point[key] = calculateSignal(params.tr, te, params.flipAngle, tissues[key], params.sequenceType, params.ti);
      });
      data.push(point);
    }
  } else if (chartType === 'ti') {
    for (let ti = 0; ti <= 4000; ti += 50) {
      const point: Record<string, number> = { x: ti };
      tissueKeys.forEach((key) => {
        point[key] = calculateSignal(params.tr, params.te, params.flipAngle, tissues[key], params.sequenceType, ti);
      });
      data.push(point);
    }
  } else if (chartType === 'relaxation') {
    for (let t = 0; t <= 4000; t += 50) {
      const point: Record<string, number> = { x: t };
      tissueKeys.forEach((key) => {
        point[key] = 1 - Math.exp(-t / tissues[key].t1);
      });
      data.push(point);
    }
  } else if (chartType === 't2relaxation') {
    for (let t = 0; t <= 500; t += 5) {
      const point: Record<string, number> = { x: t };
      tissueKeys.forEach((key) => {
        const decayConst = params.sequenceType === 'bssfp' ? tissues[key].t2 : tissues[key].t2star;
        point[key] = Math.exp(-t / decayConst);
      });
      data.push(point);
    }
  }

  return data;
};
