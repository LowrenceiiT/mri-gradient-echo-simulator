export type SequenceType = 'spoiled' | 'bssfp' | 'fisp' | 'inversion';
export type SoundMode = 'visual' | 'realtime' | 'all';
export type SoundTheme = 'mechanical' | 'digital';
export type DifficultyLevel = 'basic' | 'normal' | 'expert';

export interface SequenceParams {
  tr: number;
  te: number;
  ti: number;
  flipAngle: number;
  sequenceType: SequenceType;
  gzAmp: number;
  gyAmp: number;
  gxAmp: number;
}

export interface TissueParams {
  t1: number;
  t2: number;
  t2star: number;
  pd: number;
}

export interface LessonStep {
  text: string;
  delay?: number;
  highlight?: string;
  chartTab?: string;
  params?: Partial<SequenceParams>;
}

export interface Lesson {
  title: string;
  steps: LessonStep[];
}

declare global {
  interface Window {
    Plotly?: {
      react: (el: HTMLDivElement, data: unknown, layout: unknown, config: unknown) => void;
      relayout: (el: HTMLDivElement, layout: unknown) => void;
    };
  }
}
