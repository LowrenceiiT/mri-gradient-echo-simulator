import { SequenceParams, SequenceType, Lesson, DifficultyLevel } from '../types';

/**
 * Educational scripts for MRI Physics adapted for different difficulty levels
 */
const LESSONS: Record<SequenceType, Record<DifficultyLevel, Lesson>> = {
  spoiled: {
    basic: {
      title: 'Basics of T1 Contrast',
      steps: [
        { text: "Hi! I'm your AI tutor. Today we'll learn how to make distinct tissues look bright or dark.", delay: 2000 },
        { text: 'Look at the Repetition Time, or TR. Think of this as the heartbeat of the scanner.', highlight: 'ctrl-tr', params: { tr: 500 }, delay: 2000 },
        { text: 'If we set a short TR, tissues with fast recovery (like Fat) get bright. This is T1 weighting.', highlight: 'ctrl-tr', params: { tr: 200 }, delay: 2000 },
        { text: 'Now look at the Flip Angle. This is how hard we push the magnets.', highlight: 'ctrl-flip', params: { flipAngle: 20 }, delay: 2000 },
        { text: 'For T1 imaging, we need a large push. Watch the contrast improve as I increase it.', highlight: 'ctrl-flip', params: { flipAngle: 70 }, delay: 2000 },
        { text: 'Great! Short TR + Large Angle = T1 Contrast. Try playing with the sliders yourself!', delay: 0 }
      ]
    },
    normal: {
      title: 'Spoiled GRE: T1 & PD Weighting',
      steps: [
        { text: 'Welcome to the Spoiled Gradient Echo lesson. This sequence is the workhorse for T1-weighted imaging.', params: { tr: 100, te: 5, flipAngle: 10 }, delay: 1000 },
        { text: 'In a Spoiled GRE, we use a gradient to destroy transverse magnetization after each cycle.', highlight: 'ctrl-sequence-type', delay: 2000 },
        { text: 'Let\'s demonstrate T1 Weighting. To achieve this, we need a short TR to maximize the difference in recovery between tissues.', highlight: 'ctrl-tr', params: { tr: 100 }, delay: 1000 },
        { text: 'We also need a large Flip Angle. Watch as I increase the flip angle to 70 degrees.', highlight: 'ctrl-flip', params: { flipAngle: 70 }, delay: 2000 },
        { text: 'Now, let\'s switch to Proton Density weighting. I will increase the TR significantly to minimize T1 effects.', highlight: 'ctrl-tr', params: { tr: 800 }, delay: 1500 },
        { text: 'And critically, we lower the Flip Angle. The signal now depends mostly on proton density.', highlight: 'ctrl-flip', params: { flipAngle: 10 }, delay: 2000 }
      ]
    },
    expert: {
      title: 'Expert: RF Spoiling & Ernst Angle',
      steps: [
        { text: 'Let\'s look under the hood. The core physics problem is the Steady State: TR is shorter than T2, so magnetization hangs around.', delay: 2500 },
        { text: 'Spoiled GRE is \"The Destroyer\". We actively kill this leftover signal using RF Spoiling.', highlight: 'ctrl-sequence-type', delay: 2000 },
        { text: 'The scanner phase-shifts the RF pulse quadratically, typically by 117 degrees every TR.', highlight: 'ctrl-sequence-type', delay: 2500 },
        { text: 'This 117-degree shift causes leftover vectors to cancel out. Since memory is destroyed, signal depends entirely on T1 recovery.', delay: 2500 },
        { text: 'To maximize this T1 signal, we use the Ernst Angle formula: Cosine Alpha equals e to the negative TR over T1.', highlight: 'ctrl-flip', delay: 2500 },
        { text: 'Let\'s test this. For White Matter (T1 of 600ms) at a TR of 100ms, the math predicts an angle of 32 degrees.', highlight: 'ctrl-tr', params: { tr: 100 }, delay: 2000 },
        { text: 'I am setting the flip angle to exactly 32 degrees. Watch the signal curve peak.', highlight: 'ctrl-flip', params: { flipAngle: 32 }, delay: 2500 },
        { text: 'Clinical Superpower: This pure T1 weighting makes it the gold standard for Dynamic Contrast Enhanced (DCE) imaging.', delay: 2000 },
        { text: 'Translation time: Siemens calls this FLASH or VIBE. GE calls it SPGR. Philips calls it T1-FFE.', delay: 3000 }
      ]
    }
  },
  bssfp: {
    basic: {
      title: 'Bright Fluid Imaging',
      steps: [
        { text: 'This mode is called bSSFP. It makes fluids look very bright, like water in a glass.', delay: 2000 },
        { text: 'We use a very fast heartbeat (Short TR) to keep the signal alive.', highlight: 'ctrl-tr', params: { tr: 10 }, delay: 2000 },
        { text: 'Look at the CSF (Cerebrospinal Fluid). It\'s the blue line. See how high the signal is?', delay: 2000 },
        { text: 'This is great for looking at the heart or blood vessels.', delay: 1000 }
      ]
    },
    normal: {
      title: 'Balanced SSFP (TrueFISP)',
      steps: [
        { text: 'Welcome to Balanced Steady-State Free Precession. This sequence recycles transverse magnetization.', highlight: 'ctrl-sequence-type', params: { tr: 10, te: 5, flipAngle: 30 }, delay: 1000 },
        { text: "Because we balance all gradients, the magnetization reaches a 'Steady State'. Mxy doesn't decay to zero.", delay: 2000 },
        { text: 'The contrast is determined by the ratio of T2 over T1. Fluids have high T2/T1 ratios.', highlight: 'ctrl-tissues', delay: 1500 },
        { text: 'Let\'s set the optimal Flip Angle for bSSFP, typically higher than spoiled sequences, around 50 degrees.', highlight: 'ctrl-flip', params: { flipAngle: 50 }, delay: 2000 }
      ]
    },
    expert: {
      title: 'Expert: Balanced Physics & Banding',
      steps: [
        { text: "This is 'The Recycler', or TrueFISP. It's the most sophisticated sequence here.", delay: 2000 },
        { text: 'Look at the gradients in the diagram. Positive lobes exactly cancel negative lobes on ALL axes: Slice, Phase, and Read.', highlight: 'ctrl-gradients', delay: 3000 },
        { text: 'This means the Net Gradient Area is zero. Stationary spins accumulate ZERO phase over a TR.', delay: 2500 },
        { text: "To start without chaos, we use an 'Alpha over 2' prep pulse to bend magnetization perfectly into steady state.", delay: 2500 },
        { text: 'Contrast depends on the T2 over T1 ratio. Blood and Fluid have a high ratio, making them bright without dye.', highlight: 'ctrl-tissues', delay: 2500 },
        { text: 'The Achilles Heel is Banding Artifacts. Off-resonance spins drift out of phase and kill the signal.', delay: 2500 },
        { text: 'We fix this by shimming the magnet, or by minimizing TR. Watch the artifacts disappear as I drop TR to 5ms.', highlight: 'ctrl-tr', params: { tr: 5 }, delay: 3000 },
        { text: 'Translation time: Siemens TrueFISP, GE FIESTA, Philips Balanced FFE.', delay: 3000 }
      ]
    }
  },
  fisp: {
    basic: {
      title: 'Basic FISP',
      steps: [
        { text: 'FISP is a mix between the other two modes.', delay: 1000 },
        { text: 'It\'s fast, but gives us a different look at the tissues.', delay: 1000 }
      ]
    },
    normal: {
      title: 'FISP (Steady State GRE)',
      steps: [
        { text: 'FISP is a steady-state sequence, but unlike bSSFP, it is not fully balanced.', highlight: 'ctrl-sequence-type', params: { tr: 50, te: 5, flipAngle: 30 }, delay: 1000 },
        { text: 'It provides a mix of T1 and T2* contrast. Watch how the signal changes as we manipulate the Flip Angle.', highlight: 'ctrl-flip', params: { flipAngle: 45 }, delay: 1500 }
      ]
    },
    expert: {
      title: 'Expert: The Hybrid Legacy',
      steps: [
        { text: "FISP is 'The Hybrid'. It uses a rewinder on the Phase axis, but the Readout axis remains unbalanced.", highlight: 'ctrl-gradients', delay: 3000 },
        { text: 'The signal is a complex mix of the Free Induction Decay (FID) and the Stimulated Echo.', highlight: 'ctrl-sequence-type', delay: 2500 },
        { text: 'It creates a mix of T1 and T2* weighting. However, it is extremely sensitive to motion.', delay: 2500 },
        { text: 'It has largely been replaced by TrueFISP because TrueFISP offers much higher Signal-to-Noise Ratio.', delay: 2500 },
        { text: 'Translation time: Siemens FISP, GE GRASS, Philips FFE.', delay: 3000 }
      ]
    }
  },
  inversion: {
    basic: {
      title: 'Dark Fluid (FLAIR)',
      steps: [
        { text: 'Sometimes we need to hide the bright fluid (CSF) to see the brain better.', delay: 2000 },
        { text: 'We use a special preparation timer called TI (Inversion Time).', highlight: 'ctrl-ti', delay: 2000 },
        { text: 'Watch what happens when I change TI. The fluid signal disappears!', params: { ti: 2500 }, highlight: 'ctrl-ti', delay: 3000 }
      ]
    },
    normal: {
      title: 'Inversion Recovery: FLAIR',
      steps: [
        { text: 'Inversion Recovery uses a 180-degree pulse to flip magnetization before we start scanning.', highlight: 'ctrl-sequence-type', params: { tr: 6000, te: 20, ti: 100 }, delay: 2500 },
        { text: "As the magnetization recovers, it crosses zero. We can time our scan to hit this 'Null Point'.", delay: 2500 },
        { text: 'Let\'s demonstrate FLAIR (Fluid Attenuated Inversion Recovery). We want to null CSF.', highlight: 'ctrl-tissues', delay: 2000 },
        { text: 'CSF has a long T1 (4500ms). The null point is around 3000ms. I\'m moving TI there now.', highlight: 'ctrl-ti', chartTab: 'ti', params: { ti: 3100 }, delay: 3000 },
        { text: 'Look at the graph! The Blue line (CSF) hits zero. This allows us to see lesions next to ventricles.', highlight: 'view-charts', delay: 3000 }
      ]
    },
    expert: {
      title: 'Expert: IR Null Points & STIR',
      steps: [
        { text: 'Inversion Recovery is the gold standard for tissue suppression.', delay: 2000 },
        { text: 'The Physics: We invert Mz to -1. It recovers as 1 - 2*exp(-TI/T1).', highlight: 'view-charts', chartTab: 'ti', delay: 3000 },
        { text: "The signal magnitude is the absolute value of this recovery. The 'V' shape on the graph shows the null point.", delay: 3000 },
        { text: 'Let\'s perform STIR (Short Tau Inversion Recovery) to suppress Fat.', delay: 2000 },
        { text: 'Fat has a short T1 (~250ms). Its null point is T1 * ln(2), which is approx 170ms.', highlight: 'ctrl-ti', params: { ti: 170 }, delay: 3000 },
        { text: 'Notice the Pink line (Fat) is nulled. This is critical for musculoskeletal imaging to see edema in bone marrow.', highlight: 'view-charts', delay: 3000 },
        { text: 'Important: STIR is field-strength independent, unlike Fat-Sat pulses.', delay: 2500 }
      ]
    }
  }
};

type UpdateCallback = (text: string, params?: Partial<SequenceParams>, highlightId?: string) => void;
type FinishCallback = () => void;

export class TeachingEngine {
  private synth = window.speechSynthesis;
  private currentLesson: Lesson | null = null;
  private stepIndex = 0;
  private onUpdate: UpdateCallback | null = null;
  private onFinish: FinishCallback | null = null;
  private isRunning = false;
  private timer: number | undefined;

  start(sequenceType: SequenceType, difficulty: DifficultyLevel, onUpdate: UpdateCallback, onFinish: FinishCallback) {
    this.stop();
    this.currentLesson = LESSONS[sequenceType][difficulty] || LESSONS[sequenceType].normal;
    this.stepIndex = 0;
    this.onUpdate = onUpdate;
    this.onFinish = onFinish;
    this.isRunning = true;
    this.executeStep();
  }

  stop() {
    this.isRunning = false;
    this.synth.cancel();
    if (this.timer) clearTimeout(this.timer);
    if (this.onFinish) this.onFinish();
  }

  private executeStep() {
    if (!this.isRunning || !this.currentLesson) return;

    if (this.stepIndex >= this.currentLesson.steps.length) {
      this.stop();
      return;
    }

    const step = this.currentLesson.steps[this.stepIndex];

    if (this.onUpdate) {
      this.onUpdate(step.text, step.params, step.highlight);
    }

    const utterance = new SpeechSynthesisUtterance(step.text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = this.synth.getVoices();
    const preferredVoice = voices.find((v) => v.name.includes('Google US English')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      if (!this.isRunning) return;
      this.timer = window.setTimeout(() => {
        this.stepIndex++;
        this.executeStep();
      }, step.delay || 1000);
    };

    this.synth.speak(utterance);
  }
}

export const teachingEngine = new TeachingEngine();
